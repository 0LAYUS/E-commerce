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

-- Get effective stock (total for variants or product base stock)
CREATE OR REPLACE FUNCTION public.get_product_effective_stock(p_product_id UUID)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get products with effective stock (batch)
CREATE OR REPLACE FUNCTION public.get_products_with_effective_stock(product_ids UUID[])
RETURNS TABLE(product_id UUID, effective_stock INTEGER) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reserve stock for order (returns true if successful)
CREATE OR REPLACE FUNCTION public.reserve_stock(p_sku_id UUID, p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement SKU stock
CREATE OR REPLACE FUNCTION public.decrement_sku_stock(p_sku_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.product_skus
  SET stock = stock - p_quantity
  WHERE id = p_sku_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement product stock (for products without variants)
CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - p_quantity
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

commit;
