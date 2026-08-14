-- Re-add archived column to products table
ALTER TABLE IF EXISTS "public"."products"
  ADD COLUMN IF NOT EXISTS "archived" boolean NOT NULL DEFAULT false;
