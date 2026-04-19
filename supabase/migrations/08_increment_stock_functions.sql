-- 08_increment_stock_functions.sql
-- Functions to increment stock (for order cancellation/refunds)

CREATE OR REPLACE FUNCTION public.increment_sku_stock(p_sku_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.product_skus
  SET stock = stock + p_quantity
  WHERE id = p_sku_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = stock + p_quantity
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

commit;
