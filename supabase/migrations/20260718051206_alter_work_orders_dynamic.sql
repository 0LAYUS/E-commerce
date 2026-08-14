BEGIN;

-- 1. Eliminar campos estáticos específicos de un solo negocio
ALTER TABLE public.work_orders 
  DROP COLUMN device_model,
  DROP COLUMN issue_description;

-- 2. Añadir campo JSONB para metadata personalizada y configuración de campos
ALTER TABLE public.work_orders 
  ADD COLUMN custom_metadata JSONB DEFAULT '{}'::jsonb NOT NULL;

-- 3. Crear tabla de configuración de plantillas por Tenant
CREATE TABLE IF NOT EXISTS public.work_order_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL, -- ej. "Reparación de Celulares", "Veterinaria"
    schema JSONB NOT NULL, -- Define qué campos pedir (nombre, tipo, requerido)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.work_order_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read and insert for now, or match business rules
CREATE POLICY "Enable read access for authenticated users" ON public.work_order_templates
    AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.work_order_templates
    AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON public.work_order_templates
    AS PERMISSIVE FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

COMMIT;
