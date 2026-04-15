-- Variant System for Products
-- Allows unlimited options (Color, Size, Material) that generate SKUs via Cartesian product

begin;

-- 1. Product Option Types (e.g., "Color", "Size", "Material")
CREATE TABLE IF NOT EXISTS public.product_option_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, name)
);

-- 2. Product Option Values (e.g., "Red", "Blue", "S", "M", "L")
CREATE TABLE IF NOT EXISTS public.product_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_type_id UUID REFERENCES public.product_option_types(id) ON DELETE CASCADE NOT NULL,
  value TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(option_type_id, value)
);

-- 3. Product SKUs (each unique combination of option values)
CREATE TABLE IF NOT EXISTS public.product_skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  sku_code TEXT NOT NULL UNIQUE,
  price_override INTEGER,  -- NULL means use product base price, otherwise this price
  stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SKU to Option Values junction table
CREATE TABLE IF NOT EXISTS public.sku_option_values (
  sku_id UUID REFERENCES public.product_skus(id) ON DELETE CASCADE NOT NULL,
  option_value_id UUID REFERENCES public.product_option_values(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (sku_id, option_value_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_option_types_product ON public.product_option_types(product_id);
CREATE INDEX IF NOT EXISTS idx_option_values_type ON public.product_option_values(option_type_id);
CREATE INDEX IF NOT EXISTS idx_skus_product ON public.product_skus(product_id);
CREATE INDEX IF NOT EXISTS idx_sku_option_values_sku ON public.sku_option_values(sku_id);

-- RLS Policies
ALTER TABLE public.product_option_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_option_values ENABLE ROW LEVEL SECURITY;

-- Everyone can see option types and values (needed for product page)
CREATE POLICY "Option types are viewable by everyone." ON public.product_option_types FOR SELECT USING (true);
CREATE POLICY "Option values are viewable by everyone." ON public.product_option_values FOR SELECT USING (true);
CREATE POLICY "SKUs are viewable by everyone." ON public.product_skus FOR SELECT USING (true);
CREATE POLICY "SKU option values are viewable by everyone." ON public.sku_option_values FOR SELECT USING (true);

-- Only admins can manage option types
CREATE POLICY "Admins can manage option types." ON public.product_option_types FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador');
CREATE POLICY "Admins can manage option values." ON public.product_option_values FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador');
CREATE POLICY "Admins can manage SKUs." ON public.product_skus FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador');
CREATE POLICY "Admins can manage SKU option values." ON public.sku_option_values FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador');

-- Modify order_items to track variant_id (optional, for analytics)
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_skus(id) ON DELETE SET NULL;

-- Update existing order_items entries to set variant_id to NULL (no data loss)
-- New orders after this migration will populate variant_id when applicable

-- Helper function to get final price for a product (checks SKU override or base price)
CREATE OR REPLACE FUNCTION public.get_product_price(p_product_id UUID, p_variant_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get available stock
CREATE OR REPLACE FUNCTION public.get_product_stock(p_product_id UUID, p_variant_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

commit;
