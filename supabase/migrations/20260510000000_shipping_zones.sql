BEGIN;

-- Tabla de zonas de envío con costos y umbrales de envío gratis
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  free_threshold integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zonas de envío visibles por todos."
  ON public.shipping_zones FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Solo administradores pueden gestionar zonas de envío."
  ON public.shipping_zones FOR ALL
  TO public
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

-- Agregar columna shipping_cost a orders (para guardar el costo de envío al momento de la compra)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_cost integer NOT NULL DEFAULT 0;

-- Agregar columna shipping_zone_id a orders (referencia a la zona usada)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_zone_id uuid;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_shipping_zone_id_fkey
  FOREIGN KEY (shipping_zone_id) REFERENCES public.shipping_zones(id);

-- Data inicial de ejemplo (zona única "Nacional")
INSERT INTO public.shipping_zones (name, cost, free_threshold, position) VALUES
  ('Nacional', 15000, 200000, 0)
ON CONFLICT DO NOTHING;

COMMIT;