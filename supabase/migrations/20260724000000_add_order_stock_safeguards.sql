-- supabase/migrations/20260724000000_add_order_stock_safeguards.sql

-- 1. Modificar la tabla de órdenes (orders)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stock_returned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS needs_manual_review BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.stock_reservations(id);

-- 2. Crear restricción única (Unique Constraint) e índice
ALTER TABLE public.orders 
ADD CONSTRAINT unique_reservation_id UNIQUE (reservation_id);

CREATE INDEX IF NOT EXISTS idx_orders_reservation_id ON public.orders(reservation_id);

-- 3. Crear RPC para Descuento Atómico de Orden Manual
CREATE OR REPLACE FUNCTION public.create_manual_order_with_stock(
  p_order_data jsonb,
  p_items jsonb
) RETURNS uuid AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_updated_id uuid;
BEGIN
  -- Descontar stock item por item, todo-o-nada
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'variant_id') IS NOT NULL THEN
      UPDATE public.product_skus
      SET stock = stock - (v_item->>'quantity')::int
      WHERE id = (v_item->>'variant_id')::uuid
        AND stock >= (v_item->>'quantity')::int
      RETURNING id INTO v_updated_id;
    ELSE
      UPDATE public.products
      SET stock = stock - (v_item->>'quantity')::int
      WHERE id = (v_item->>'product_id')::uuid
        AND stock >= (v_item->>'quantity')::int
      RETURNING id INTO v_updated_id;
    END IF;

    IF v_updated_id IS NULL THEN
      RAISE EXCEPTION 'STOCK_AGOTADO: item %', coalesce(v_item->>'variant_id', v_item->>'product_id');
    END IF;
  END LOOP;

  -- Solo si TODOS los items tuvieron stock, se inserta la orden y sus items.
  INSERT INTO public.orders (
    user_id,
    total_amount,
    status,
    payment_method,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    shipping_cost,
    shipping_zone_id
  ) VALUES (
    (p_order_data->>'user_id')::uuid,
    (p_order_data->>'total_amount')::int,
    (p_order_data->>'status')::public.order_status,
    (p_order_data->>'payment_method')::text,
    p_order_data->>'customer_name',
    p_order_data->>'customer_email',
    p_order_data->>'customer_phone',
    p_order_data->>'shipping_address',
    (p_order_data->>'shipping_cost')::int,
    (p_order_data->>'shipping_zone_id')::uuid
  ) RETURNING id INTO v_order_id;

  -- Insertar los items de la orden
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      price_at_purchase
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'variant_id')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'price_at_purchase')::int
    );
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Crear RPC para Idempotencia del Webhook de Wompi
CREATE OR REPLACE FUNCTION public.process_wompi_approved(p_order_id uuid, p_reservation_id uuid)
RETURNS text AS $$
DECLARE
  v_order_updated uuid;
  v_confirmed uuid;
BEGIN
  -- Gate atómico de idempotencia
  UPDATE public.orders SET status = 'APPROVED'
  WHERE id = p_order_id AND status != 'APPROVED'
  RETURNING id INTO v_order_updated;

  IF v_order_updated IS NULL THEN
    RETURN 'ALREADY_PROCESSED';
  END IF;

  -- Intentar confirmar la reserva atómicamente
  IF p_reservation_id IS NOT NULL THEN
    UPDATE public.stock_reservations
    SET status = 'confirmed', confirmed_at = now()
    WHERE id = p_reservation_id AND status = 'pending' AND expires_at > now()
    RETURNING id INTO v_confirmed;
  END IF;

  IF v_confirmed IS NULL THEN
    -- Reserva ya expiró/limpiada o nunca tuvo reserva: la plata ya entró, no podemos rechazar.
    -- (OJO: Aquí es donde podríamos intentar un descuento directo, pero siguiendo la simplificación, 
    -- lo enviamos a revisión manual y el administrador deberá decidir).
    UPDATE public.orders SET needs_manual_review = true WHERE id = p_order_id;
    RETURN 'APPROVED_NEEDS_REVIEW';
  END IF;

  RETURN 'APPROVED';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
