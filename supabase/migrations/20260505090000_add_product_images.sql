BEGIN;

-- Product images (multiple per product)
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS product_images_product_position_unique
  ON public.product_images (product_id, position);

CREATE INDEX IF NOT EXISTS product_images_product_id_idx
  ON public.product_images (product_id);

-- Variant images (multiple per variant SKU)
CREATE TABLE IF NOT EXISTS public.product_variant_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id uuid NOT NULL REFERENCES public.product_skus(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.product_variant_images ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS product_variant_images_sku_position_unique
  ON public.product_variant_images (sku_id, position);

CREATE INDEX IF NOT EXISTS product_variant_images_sku_id_idx
  ON public.product_variant_images (sku_id);

-- Backfill first image from products.image_url
INSERT INTO public.product_images (product_id, url, alt, position)
SELECT id, image_url, name, 0
FROM public.products
WHERE image_url IS NOT NULL AND image_url <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images pi WHERE pi.product_id = products.id
  );

-- RLS policies for product_images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'product_images_read') THEN
    CREATE POLICY product_images_read
      ON public.product_images
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'product_images_write') THEN
    CREATE POLICY product_images_write
      ON public.product_images
      FOR INSERT
      WITH CHECK (auth.role() IN ('authenticated', 'service_role'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'product_images_update') THEN
    CREATE POLICY product_images_update
      ON public.product_images
      FOR UPDATE
      USING (auth.role() IN ('authenticated', 'service_role'))
      WITH CHECK (auth.role() IN ('authenticated', 'service_role'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'product_images_delete') THEN
    CREATE POLICY product_images_delete
      ON public.product_images
      FOR DELETE
      USING (auth.role() IN ('authenticated', 'service_role'));
  END IF;
END $$;

-- RLS policies for product_variant_images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_variant_images' AND policyname = 'product_variant_images_read') THEN
    CREATE POLICY product_variant_images_read
      ON public.product_variant_images
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_variant_images' AND policyname = 'product_variant_images_write') THEN
    CREATE POLICY product_variant_images_write
      ON public.product_variant_images
      FOR INSERT
      WITH CHECK (auth.role() IN ('authenticated', 'service_role'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_variant_images' AND policyname = 'product_variant_images_update') THEN
    CREATE POLICY product_variant_images_update
      ON public.product_variant_images
      FOR UPDATE
      USING (auth.role() IN ('authenticated', 'service_role'))
      WITH CHECK (auth.role() IN ('authenticated', 'service_role'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_variant_images' AND policyname = 'product_variant_images_delete') THEN
    CREATE POLICY product_variant_images_delete
      ON public.product_variant_images
      FOR DELETE
      USING (auth.role() IN ('authenticated', 'service_role'));
  END IF;
END $$;

COMMIT;
