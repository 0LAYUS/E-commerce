BEGIN;

ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

INSERT INTO public.work_order_templates (tenant_id, name, schema)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'Servicio Técnico Estándar', 
    '{"type": "object", "properties": {"device_model": {"type": "string", "title": "Modelo del Dispositivo", "required": true}, "issue_description": {"type": "string", "title": "Descripción del Problema", "required": true}, "password": {"type": "string", "title": "Contraseña / PIN del dispositivo", "required": false}}}'::jsonb
);

COMMIT;
