-- Migration: fix_create_stock_reservation_merge
-- Fixes the create_stock_reservation function to MERGE items into existing reservations
-- instead of returning early and ignoring new items

CREATE OR REPLACE FUNCTION "public"."create_stock_reservation"("p_user_id" "uuid", "p_items" "jsonb", "p_reservation_minutes" integer DEFAULT 15) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;

ALTER FUNCTION "public"."create_stock_reservation"("p_user_id" "uuid", "p_items" "jsonb", "p_reservation_minutes" integer) OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."create_stock_reservation"("p_user_id" "uuid", "p_items" "jsonb", "p_reservation_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_stock_reservation"("p_user_id" "uuid", "p_items" "jsonb", "p_reservation_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_stock_reservation"("p_user_id" "uuid", "p_items" "jsonb", "p_reservation_minutes" integer) TO "service_role";