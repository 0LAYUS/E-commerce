-- Add archived column to categories, products, and product_skus for soft-delete functionality

-- Categories: add archived
ALTER TABLE categories ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false NOT NULL;

-- Products: add archived
ALTER TABLE products ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false NOT NULL;

-- Product SKUs (variants): add archived
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN categories.archived IS 'Soft-delete flag. True means the category is archived.';
COMMENT ON COLUMN products.archived IS 'Soft-delete flag. True means the product is archived.';
COMMENT ON COLUMN product_skus.archived IS 'Soft-delete flag. True means the variant is archived.';
