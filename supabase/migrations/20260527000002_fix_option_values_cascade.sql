BEGIN;

-- Add ON DELETE CASCADE to product_option_values FK
-- Without this, deleting a product_option_type while values exist throws FK violation
-- This happened when editing a product's variants

ALTER TABLE public.product_option_values
  DROP CONSTRAINT IF EXISTS product_option_values_option_type_id_fkey;

ALTER TABLE public.product_option_values
  ADD CONSTRAINT product_option_values_option_type_id_fkey
  FOREIGN KEY (option_type_id) REFERENCES public.product_option_types (id)
  ON DELETE CASCADE;

COMMIT;
