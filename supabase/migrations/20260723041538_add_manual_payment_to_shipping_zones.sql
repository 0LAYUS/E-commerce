ALTER TABLE shipping_zones 
ADD COLUMN manual_payment_allowed BOOLEAN DEFAULT false NOT NULL;
