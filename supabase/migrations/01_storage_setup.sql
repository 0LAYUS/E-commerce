-- Create bucket "product-images"
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for "product-images"
CREATE POLICY "Public read for product-images" 
ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admin write for product-images" 
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador'
);

CREATE POLICY "Admin delete for product-images" 
ON storage.objects FOR DELETE USING (
  bucket_id = 'product-images' 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador'
);
