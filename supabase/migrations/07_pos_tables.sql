-- POS Tables for Point of Sale system
begin;

-- 1. POS Sales table
CREATE TABLE IF NOT EXISTS public.pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.profiles(id) NOT NULL,
  customer_name TEXT,
  items JSONB NOT NULL,
  -- items format: [{
  --   "product_id": "uuid",
  --   "variant_id": "uuid | null",
  --   "name": "string",
  --   "sku": "string | null",
  --   "quantity": number,
  --   "unit_price": number,
  --   "discount_pct": number,
  --   "subtotal": number
  -- }]
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason TEXT,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia', 'mixto')),
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
  amount_received DECIMAL(10,2),
  change_amount DECIMAL(10,2),
  notes TEXT,
  channel TEXT DEFAULT 'pos',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;

-- 2. POS Sale Payments (for mixed payments)
CREATE TABLE IF NOT EXISTS public.pos_sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.pos_sales(id) ON DELETE CASCADE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('efectivo', 'tarjeta', 'transferencia')),
  amount DECIMAL(10,2) NOT NULL
);

ALTER TABLE public.pos_sale_payments ENABLE ROW LEVEL SECURITY;

-- 3. POS Cash Events (for cash drawer tracking)
CREATE TABLE IF NOT EXISTS public.pos_cash_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'cashup', 'expense', 'income')),
  amount DECIMAL(10,2),
  payment_method TEXT CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pos_cash_events ENABLE ROW LEVEL SECURITY;

-- 4. POS BOGO Offers (2x1 promotions)
CREATE TABLE IF NOT EXISTS public.pos_bogo_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_skus(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pos_bogo_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for POS tables (admins only)
CREATE POLICY "Admins can do everything on pos_sales"
  ON public.pos_sales FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador');

CREATE POLICY "Admins can do everything on pos_sale_payments"
  ON public.pos_sale_payments FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador');

CREATE POLICY "Admins can do everything on pos_cash_events"
  ON public.pos_cash_events FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador');

CREATE POLICY "Admins can do everything on pos_bogo_offers"
  ON public.pos_bogo_offers FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador');

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_pos_sales_seller ON public.pos_sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_created ON public.pos_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_pos_sales_payment_method ON public.pos_sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_pos_cash_events_user ON public.pos_cash_events(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_cash_events_created ON public.pos_cash_events(created_at);
CREATE INDEX IF NOT EXISTS idx_pos_bogo_offers_product ON public.pos_bogo_offers(product_id);

-- 6. Function to decrement stock for POS sale
CREATE OR REPLACE FUNCTION public.decrement_pos_stock(p_items JSONB)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to restore stock (for void/cancel)
CREATE OR REPLACE FUNCTION public.restore_pos_stock(p_items JSONB)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

commit;
