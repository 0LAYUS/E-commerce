-- Stock Reservations for checkout timeout handling
begin;

-- 1. Stock Reservations table
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cart_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations." ON public.stock_reservations FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own pending reservations." ON public.stock_reservations FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- 2. Reservation Items table
CREATE TABLE IF NOT EXISTS public.stock_reservation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.stock_reservations(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_skus(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.stock_reservation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items of their own reservations." ON public.stock_reservation_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stock_reservations 
    WHERE public.stock_reservations.id = stock_reservation_items.reservation_id 
    AND public.stock_reservations.user_id = auth.uid()
  ));

-- 3. Indexes for cleanup queries
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.stock_reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON public.stock_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation ON public.stock_reservation_items(reservation_id);

-- 4. Function to reserve stock (updates available stock)
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
  UPDATE public.stock_reservations
  SET status = 'expired'
  WHERE user_id = p_user_id AND status = 'pending' AND expires_at <= now();

  -- Create new reservation
  INSERT INTO public.stock_reservations (user_id, cart_hash, expires_at)
  VALUES (p_user_id, v_cart_hash, now() + (p_reservation_minutes || ' minutes')::interval)
  RETURNING id INTO v_reservation_id;

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

  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to confirm reservation (on successful payment)
CREATE OR REPLACE FUNCTION public.confirm_stock_reservation(p_reservation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  SELECT * INTO v_reservation FROM public.stock_reservations WHERE id = p_reservation_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Update reservation status
  UPDATE public.stock_reservations
  SET status = 'confirmed', confirmed_at = now()
  WHERE id = p_reservation_id;

  -- Note: Stock was already decremented when reservation was created
  -- So nothing else to do here - just mark as confirmed

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to cancel reservation (on cancel/timeout)
CREATE OR REPLACE FUNCTION public.cancel_stock_reservation(p_reservation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_item RECORD;
BEGIN
  SELECT * INTO v_item FROM public.stock_reservations WHERE id = p_reservation_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Restore stock for each item
  FOR v_item IN SELECT * FROM public.stock_reservation_items WHERE reservation_id = p_reservation_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_skus
      SET stock = stock + v_item.quantity
      WHERE id = v_item.variant_id;
    ELSE
      UPDATE public.products
      SET stock = stock + v_item.quantity
      WHERE id = v_item.product_id;
    END IF;
  END LOOP;

  -- Update reservation status
  UPDATE public.stock_reservations
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = p_reservation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to cleanup expired reservations (run by cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  v_expired_reservations UUID[];
  v_item RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Find all expired pending reservations
  SELECT ARRAY_AGG(id) INTO v_expired_reservations
  FROM public.stock_reservations
  WHERE status = 'pending' AND expires_at <= now();

  -- Process each expired reservation
  FOR v_reservation_id IN SELECT unnest(v_expired_reservations)
  LOOP
    -- Restore stock
    FOR v_item IN SELECT * FROM public.stock_reservation_items WHERE reservation_id = v_reservation_id
    LOOP
      IF v_item.variant_id IS NOT NULL THEN
        UPDATE public.product_skus
        SET stock = stock + v_item.quantity
        WHERE id = v_item.variant_id;
      ELSE
        UPDATE public.products
        SET stock = stock + v_item.quantity
        WHERE id = v_item.product_id;
      END IF;
    END LOOP;

    -- Mark as expired
    UPDATE public.stock_reservations
    SET status = 'expired'
    WHERE id = v_reservation_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

commit;