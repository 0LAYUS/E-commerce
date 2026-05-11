CREATE OR REPLACE FUNCTION public.count_pos_sales_for_product(p_product_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT ps.id) INTO v_count
  FROM public.pos_sales ps
  WHERE ps.items::text LIKE '%' || p_product_id::text || '%';
  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.count_pos_sales_for_variant(p_variant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT ps.id) INTO v_count
  FROM public.pos_sales ps
  WHERE ps.items::text LIKE '%' || p_variant_id::text || '%';
  RETURN COALESCE(v_count, 0);
END;
$$;