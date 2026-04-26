BEGIN;

CREATE OR REPLACE FUNCTION public.cancel_stock_reservation_by_user(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_item RECORD;
  v_product_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Get all pending expired reservations for this user
  FOR v_item IN 
    SELECT sr.id, sri.product_id, sri.variant_id, sri.quantity
    FROM public.stock_reservations sr
    JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
    WHERE sr.user_id = p_user_id 
    AND sr.status = 'pending' 
    AND sr.expires_at <= now()
  LOOP
    -- Restore stock
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_skus SET stock = stock + v_item.quantity WHERE id = v_item.variant_id;
    ELSE
      UPDATE public.products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
    END IF;
    
    -- Collect product_ids for flag update
    IF v_item.product_id != ALL(v_product_ids) THEN
      v_product_ids := array_append(v_product_ids, v_item.product_id);
    END IF;
    
    -- Mark reservation as expired
    UPDATE public.stock_reservations SET status = 'expired' WHERE id = v_item.id;
  END LOOP;

  -- Update flags - set to false only if no pending reservations for that product
  IF array_length(v_product_ids, 1) IS NOT NULL THEN
    UPDATE public.products p
    SET has_active_reservation = false
    WHERE p.id = ANY(v_product_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.stock_reservations sr
      JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
      WHERE sri.product_id = p.id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    );
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_stock_reservation(p_reservation_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_item RECORD;
  v_product_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  SELECT * INTO v_item FROM public.stock_reservations WHERE id = p_reservation_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Restore stock and collect product_ids
  FOR v_item IN SELECT * FROM public.stock_reservation_items WHERE reservation_id = p_reservation_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_skus SET stock = stock + v_item.quantity WHERE id = v_item.variant_id;
    ELSE
      UPDATE public.products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
    END IF;
    
    IF v_item.product_id != ALL(v_product_ids) THEN
      v_product_ids := array_append(v_product_ids, v_item.product_id);
    END IF;
  END LOOP;

  -- Update reservation status
  UPDATE public.stock_reservations
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = p_reservation_id;

  -- Update flags
  IF array_length(v_product_ids, 1) IS NOT NULL THEN
    UPDATE public.products p
    SET has_active_reservation = false
    WHERE p.id = ANY(v_product_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.stock_reservations sr
      JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
      WHERE sri.product_id = p.id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    );
  END IF;

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations_for_product(p_product_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_item RECORD;
  v_reservation_id UUID;
BEGIN
  -- Find expired pending reservations for this product
  FOR v_item IN
    SELECT sr.id, sri.variant_id, sri.quantity
    FROM public.stock_reservations sr
    JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
    WHERE sri.product_id = p_product_id
    AND sr.status = 'pending'
    AND sr.expires_at <= now()
  LOOP
    -- Restore stock
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_skus SET stock = stock + v_item.quantity WHERE id = v_item.variant_id;
    ELSE
      UPDATE public.products SET stock = stock + v_item.quantity WHERE id = p_product_id;
    END IF;
    
    -- Mark reservation as expired
    UPDATE public.stock_reservations SET status = 'expired' WHERE id = v_item.id;
  END LOOP;

  -- Update flag if no more pending reservations for this product
  UPDATE public.products p
  SET has_active_reservation = false
  WHERE p.id = p_product_id
  AND NOT EXISTS (
    SELECT 1 FROM public.stock_reservations sr
    JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
    WHERE sri.product_id = p_product_id
    AND sr.status = 'pending'
    AND sr.expires_at > now()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_expired_reservations UUID[];
  v_item RECORD;
  v_product_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER := 0;
  v_reservation_id UUID;
  v_i INTEGER := 0;
BEGIN
  -- Find all expired pending reservations
  SELECT ARRAY_AGG(id) INTO v_expired_reservations
  FROM public.stock_reservations
  WHERE status = 'pending' AND expires_at <= now();

  -- Process each expired reservation
  v_i := 1;
  WHILE v_i <= array_length(v_expired_reservations, 1) LOOP
    v_reservation_id := v_expired_reservations[v_i];
    
    -- Restore stock and collect product_ids
    FOR v_item IN SELECT * FROM public.stock_reservation_items WHERE reservation_id = v_reservation_id
    LOOP
      IF v_item.variant_id IS NOT NULL THEN
        UPDATE public.product_skus SET stock = stock + v_item.quantity WHERE id = v_item.variant_id;
      ELSE
        UPDATE public.products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
      END IF;
      
      IF v_item.product_id != ALL(v_product_ids) THEN
        v_product_ids := array_append(v_product_ids, v_item.product_id);
      END IF;
    END LOOP;

    -- Mark as expired
    UPDATE public.stock_reservations
    SET status = 'expired'
    WHERE id = v_reservation_id;

    v_count := v_count + 1;
    v_i := v_i + 1;
  END LOOP;

  -- Update flags
  IF array_length(v_product_ids, 1) IS NOT NULL THEN
    UPDATE public.products p
    SET has_active_reservation = false
    WHERE p.id = ANY(v_product_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.stock_reservations sr
      JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
      WHERE sri.product_id = p.id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    );
  END IF;

  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_stock_reservation(p_reservation_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_reservation RECORD;
  v_product_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  SELECT * INTO v_reservation FROM public.stock_reservations WHERE id = p_reservation_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Collect product_ids for flag update
  SELECT ARRAY_AGG(DISTINCT sri.product_id) INTO v_product_ids
  FROM public.stock_reservation_items sri
  WHERE sri.reservation_id = p_reservation_id;

  -- Update reservation status (stock already decremented at reservation time)
  UPDATE public.stock_reservations
  SET status = 'confirmed', confirmed_at = now()
  WHERE id = p_reservation_id;

  -- Update flags - set to false since reservation is confirmed
  IF array_length(v_product_ids, 1) IS NOT NULL THEN
    UPDATE public.products p
    SET has_active_reservation = false
    WHERE p.id = ANY(v_product_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.stock_reservations sr
      JOIN public.stock_reservation_items sri ON sr.id = sri.reservation_id
      WHERE sri.product_id = p.id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
      AND sr.id != p_reservation_id
    );
  END IF;

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_stock_reservation(p_user_id uuid, p_items jsonb, p_reservation_minutes integer DEFAULT 15)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_reservation_id UUID;
  v_item JSONB;
  v_reserved INTEGER := 0;
  v_cart_hash TEXT;
  v_product_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Generate cart hash from items
  v_cart_hash := encode(digest(p_items::text, 'sha256'), 'hex');

  -- Check if user already has an active reservation and merge items
  IF EXISTS (
    SELECT 1 FROM public.stock_reservations
    WHERE user_id = p_user_id
    AND status = 'pending'
    AND expires_at > now()
  ) THEN
    -- Get existing reservation
    SELECT id INTO v_reservation_id
    FROM public.stock_reservations
    WHERE user_id = p_user_id AND status = 'pending' AND expires_at > now()
    LIMIT 1;

    -- Add new items to existing reservation (skip duplicates)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      -- Check if this item already exists in reservation
      IF NOT EXISTS (
        SELECT 1 FROM public.stock_reservation_items
        WHERE reservation_id = v_reservation_id
        AND product_id = (v_item->>'product_id')::UUID
        AND COALESCE(variant_id::TEXT, 'null') = COALESCE((v_item->>'variant_id')::TEXT, 'null')
      ) THEN
        -- Add new item
        IF (v_item->>'variant_id') IS NOT NULL AND v_item->>'variant_id' != 'null' THEN
          UPDATE public.product_skus
          SET stock = stock - (v_item->>'quantity')::INTEGER
          WHERE id = (v_item->>'variant_id')::UUID
          AND stock >= (v_item->>'quantity')::INTEGER
          AND active = true;

          GET DIAGNOSTICS v_reserved = ROW_COUNT;

          INSERT INTO public.stock_reservation_items (reservation_id, product_id, variant_id, quantity)
          VALUES (v_reservation_id, (v_item->>'product_id')::UUID, (v_item->>'variant_id')::UUID, (v_item->>'quantity')::INTEGER);
        ELSE
          UPDATE public.products
          SET stock = stock - (v_item->>'quantity')::INTEGER
          WHERE id = (v_item->>'product_id')::UUID
          AND stock >= (v_item->>'quantity')::INTEGER
          AND active = true;

          GET DIAGNOSTICS v_reserved = ROW_COUNT;

          INSERT INTO public.stock_reservation_items (reservation_id, product_id, variant_id, quantity)
          VALUES (v_reservation_id, (v_item->>'product_id')::UUID, NULL, (v_item->>'quantity')::INTEGER);
        END IF;
      END IF;
    END LOOP;

    -- Update product reservation flags
    SELECT ARRAY_AGG(DISTINCT sri.product_id) INTO v_product_ids
    FROM public.stock_reservation_items sri
    WHERE sri.reservation_id = v_reservation_id;

    IF array_length(v_product_ids, 1) IS NOT NULL THEN
      UPDATE public.products
      SET has_active_reservation = true
      WHERE id = ANY(v_product_ids);
    END IF;

    RETURN v_reservation_id;
  END IF;

  -- Cancel any expired reservations for this user first
  PERFORM cancel_stock_reservation_by_user(p_user_id);

  -- Create new reservation
  INSERT INTO public.stock_reservations (user_id, cart_hash, expires_at)
  VALUES (p_user_id, v_cart_hash, now() + (p_reservation_minutes || ' minutes')::interval)
  RETURNING id INTO v_reservation_id;

  -- Collect unique product_ids for flag update
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'product_id')::UUID != ALL(v_product_ids) THEN
      v_product_ids := array_append(v_product_ids, (v_item->>'product_id')::UUID);
    END IF;
  END LOOP;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'variant_id') IS NOT NULL THEN
      -- Reserve from SKU
      UPDATE public.product_skus
      SET stock = stock - (v_item->>'quantity')::INTEGER
      WHERE id = (v_item->>'variant_id')::UUID
      AND stock >= (v_item->>'quantity')::INTEGER
      AND active = true;

      GET DIAGNOSTICS v_reserved = ROW_COUNT;

      -- Insert reservation item
      INSERT INTO public.stock_reservation_items (reservation_id, product_id, variant_id, quantity)
      VALUES (v_reservation_id, (v_item->>'product_id')::UUID, (v_item->>'variant_id')::UUID, (v_item->>'quantity')::INTEGER);
    ELSE
      -- Reserve from product
      UPDATE public.products
      SET stock = stock - (v_item->>'quantity')::INTEGER
      WHERE id = (v_item->>'product_id')::UUID
      AND stock >= (v_item->>'quantity')::INTEGER
      AND active = true;

      GET DIAGNOSTICS v_reserved = ROW_COUNT;

      -- Insert reservation item
      INSERT INTO public.stock_reservation_items (reservation_id, product_id, variant_id, quantity)
      VALUES (v_reservation_id, (v_item->>'product_id')::UUID, NULL, (v_item->>'quantity')::INTEGER);
    END IF;
  END LOOP;

  -- Update flag for all affected products
  UPDATE public.products
  SET has_active_reservation = true
  WHERE id = ANY(v_product_ids);

  RETURN v_reservation_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_pos_stock(p_items jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_item JSONB;
  v_variant_id TEXT;
  v_product_id TEXT;
  v_quantity INTEGER;
  v_decremented INTEGER := 0;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := v_item->>'variant_id';
    v_product_id := v_item->>'product_id';
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    IF v_variant_id IS NOT NULL AND v_variant_id != '' AND v_variant_id != 'null' THEN
      UPDATE public.product_skus
      SET stock = stock - v_quantity
      WHERE id = v_variant_id::UUID
      AND stock >= v_quantity;

      GET DIAGNOSTICS v_decremented = ROW_COUNT;
      IF v_decremented = 0 THEN
        RETURN FALSE;
      END IF;
    ELSIF v_product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock = stock - v_quantity
      WHERE id = v_product_id::UUID
      AND stock >= v_quantity;

      GET DIAGNOSTICS v_decremented = ROW_COUNT;
      IF v_decremented = 0 THEN
        RETURN FALSE;
      END IF;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id uuid, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.products
  SET stock = stock - p_quantity
  WHERE id = p_product_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_sku_stock(p_sku_id uuid, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.product_skus
  SET stock = stock - p_quantity
  WHERE id = p_sku_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_product_effective_stock(p_product_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_stock INTEGER;
  v_has_variants BOOLEAN;
  v_total_variant_stock INTEGER;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.product_option_types WHERE product_id = p_product_id) INTO v_has_variants;
  
  IF v_has_variants THEN
    SELECT COALESCE(SUM(stock), 0) INTO v_total_variant_stock
    FROM public.product_skus
    WHERE product_id = p_product_id;
    RETURN v_total_variant_stock;
  ELSE
    SELECT stock INTO v_stock FROM public.products WHERE id = p_product_id;
    RETURN COALESCE(v_stock, 0);
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_product_price(p_product_id uuid, p_variant_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_price INTEGER;
BEGIN
  IF p_variant_id IS NOT NULL THEN
    SELECT COALESCE(price_override, (SELECT price FROM public.products WHERE id = p_product_id))
    INTO v_price
    FROM public.product_skus
    WHERE id = p_variant_id;
  ELSE
    SELECT price INTO v_price FROM public.products WHERE id = p_product_id;
  END IF;
  RETURN COALESCE(v_price, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_product_stock_with_cleanup(p_product_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_has_active BOOLEAN;
  v_stock INTEGER;
BEGIN
  -- Check flag first
  SELECT has_active_reservation INTO v_has_active FROM public.products WHERE id = p_product_id;
  
  -- If flag is true, cleanup expired reservations first
  IF v_has_active = true THEN
    PERFORM cleanup_expired_reservations_for_product(p_product_id);
    
    -- Recheck flag after cleanup
    SELECT has_active_reservation INTO v_has_active FROM public.products WHERE id = p_product_id;
  END IF;
  
  -- Get stock
  SELECT stock INTO v_stock FROM public.products WHERE id = p_product_id;
  
  RETURN COALESCE(v_stock, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_product_stock(p_product_id uuid, p_variant_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_stock INTEGER;
BEGIN
  IF p_variant_id IS NOT NULL THEN
    SELECT stock INTO v_stock FROM public.product_skus WHERE id = p_variant_id;
  ELSE
    SELECT stock INTO v_stock FROM public.products WHERE id = p_product_id;
  END IF;
  RETURN COALESCE(v_stock, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_products_with_effective_stock(product_ids uuid[])
 RETURNS TABLE(product_id uuid, effective_stock integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pid,
    CASE 
      WHEN EXISTS(SELECT 1 FROM public.product_option_types pot WHERE pot.product_id = pid) THEN
        COALESCE((SELECT SUM(ps.stock) FROM public.product_skus ps WHERE ps.product_id = pid), 0)
      ELSE
        COALESCE((SELECT stock FROM public.products WHERE id = pid), 0)
    END as effective_stock
  FROM unnest(product_ids) AS pid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, 'sin-correo@ecommerce.com'), 
    CASE WHEN is_first_user THEN 'administrador'::public.user_role ELSE 'cliente'::public.user_role END,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'Error on profile creation trigger: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Trigger to create a profile when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.increment_product_stock(p_product_id uuid, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.products
  SET stock = stock + p_quantity
  WHERE id = p_product_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_sku_stock(p_sku_id uuid, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.product_skus
  SET stock = stock + p_quantity
  WHERE id = p_sku_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reserve_stock(p_sku_id uuid, p_product_id uuid, p_quantity integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_stock INTEGER;
  v_reserved BOOLEAN := FALSE;
BEGIN
  IF p_sku_id IS NOT NULL THEN
    UPDATE public.product_skus
    SET stock = stock - p_quantity
    WHERE id = p_sku_id AND stock >= p_quantity
    RETURNING stock INTO v_stock;
    IF v_stock IS NOT NULL THEN
      v_reserved := TRUE;
    END IF;
  ELSE
    UPDATE public.products
    SET stock = stock - p_quantity
    WHERE id = p_product_id AND stock >= p_quantity
    RETURNING stock INTO v_stock;
    IF v_stock IS NOT NULL THEN
      v_reserved := TRUE;
    END IF;
  END IF;
  
  RETURN v_reserved;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restore_pos_stock(p_items jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_item JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'variant_id') IS NOT NULL AND v_item->>'variant_id' != '' THEN
      UPDATE public.product_skus
      SET stock = stock + (v_item->>'quantity')::INTEGER
      WHERE id = (v_item->>'variant_id')::UUID;
    ELSE
      UPDATE public.products
      SET stock = stock + (v_item->>'quantity')::INTEGER
      WHERE id = (v_item->>'product_id')::UUID;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$function$;

COMMIT;