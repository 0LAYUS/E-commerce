ALTER TYPE "public"."order_status" ADD VALUE 'PENDING_MANUAL';

ALTER TABLE "public"."orders" 
ADD COLUMN "payment_method" text DEFAULT 'wompi' 
CHECK (payment_method IN ('wompi', 'manual'));
