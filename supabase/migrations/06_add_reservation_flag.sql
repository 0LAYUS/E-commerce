-- Add has_active_reservation flag to products for faster stock queries
begin;

-- 1. Add flag to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_active_reservation BOOLEAN DEFAULT false NOT NULL;

-- 2. Add index for the flag
CREATE INDEX IF NOT EXISTS idx_products_has_active_reservation ON public.products(has_active_reservation) WHERE has_active_reservation = true;

-- 3. Update create_stock_reservation to set the flag
CREATE OR REPLACE FUNCTION public.create_stock_reservation(
  p_user_id UUID,
  p_items JSONB,
  p_reservation_minutes INTEGER DEFAULT 15
)
RETURNS UUID AS $$
DECLARE
  v_reservation_id UUID;
  v_item JSONB;
  v_reserved INTEGER := 0;
  v_cart_hash TEXT;
  v_product_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Generate cart hash from items
  v_cart_hash := encode(digest(p_items::text, 'sha256'), 'hex');

  -- Check if user already has an active reservation
  IF EXISTS (
    SELECT 1 FROM public.stock_reservations 
    WHERE user_id = p_user_id 
    AND status = 'pending' 
    AND expires_at > now()
  ) THEN
    -- Return existing reservation
    SELECT id INTO v_reservation_id 
    FROM public.stock_reservations 
    WHERE user_id = p_user_id AND status = 'pending' AND expires_at > now()
    LIMIT 1;
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add helper function to cancel all expired reservations for a user
CREATE OR REPLACE FUNCTION public.cancel_stock_reservation_by_user(p_user_id UUID)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update cancel_stock_reservation to also update the flag
CREATE OR REPLACE FUNCTION public.cancel_stock_reservation(p_reservation_id UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update confirm_stock_reservation to also update the flag
CREATE OR REPLACE FUNCTION public.confirm_stock_reservation(p_reservation_id UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update cleanup_expired_reservations to also update the flag
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Add function to check if product has active reservation and optionally cleanup
CREATE OR REPLACE FUNCTION public.get_product_stock_with_cleanup(p_product_id UUID)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to cleanup expired reservations for a specific product
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations_for_product(p_product_id UUID)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

commit;