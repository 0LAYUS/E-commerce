-- Agregamos las columnas de la vista final del checkout a la tabla orders.
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipping_address TEXT;
