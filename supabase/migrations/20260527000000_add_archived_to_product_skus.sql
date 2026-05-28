BEGIN;

-- Re-add archived column to product_skus
-- This column was accidentally dropped in remote_schema but is still used by the codebase
-- (archiveVariant/unarchiveVariant in productService.ts)
ALTER TABLE public.product_skus
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

COMMIT;
