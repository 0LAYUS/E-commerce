BEGIN;

-- Grant usage on public schema to all relevant roles
-- This fixes the "permission denied for schema public" error in many environments
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- ============================================================
-- 0) Extensions (needed for gen_random_uuid())
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1) Enums
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.user_role AS ENUM ('cliente', 'administrador');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.order_status AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'ERROR');
  END IF;
END$$;

-- ============================================================
-- 2) Tables
-- ============================================================

-- public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  role public.user_role NOT NULL DEFAULT 'cliente'::public.user_role,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  first_name text NOT NULL DEFAULT ''::text,
  last_name text NOT NULL DEFAULT ''::text,
  phone text,
  address text
);

-- public.categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.categories
  ADD CONSTRAINT categories_name_unique UNIQUE (name);

-- public.products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid,
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  has_active_reservation boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false
);

-- public.orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total_amount integer NOT NULL,
  status public.order_status NOT NULL DEFAULT 'PENDING'::public.order_status,
  wompi_transaction_id text,
  customer_name varchar(255),
  customer_email varchar(255),
  shipping_address text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- public.order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price_at_purchase integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  variant_id uuid
);

-- public.product_option_types
CREATE TABLE IF NOT EXISTS public.product_option_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- public.product_option_values
CREATE TABLE IF NOT EXISTS public.product_option_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_type_id uuid NOT NULL,
  value text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- public.product_skus
CREATE TABLE IF NOT EXISTS public.product_skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  sku_code text NOT NULL,
  price_override integer,
  stock integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.product_skus
  ADD CONSTRAINT product_skus_sku_code_unique UNIQUE (sku_code);

-- public.sku_option_values (join table)
CREATE TABLE IF NOT EXISTS public.sku_option_values (
  sku_id uuid NOT NULL,
  option_value_id uuid NOT NULL,
  PRIMARY KEY (sku_id, option_value_id)
);

-- public.stock_reservations
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cart_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text
    CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'expired'::text])),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

-- public.stock_reservation_items
CREATE TABLE IF NOT EXISTS public.stock_reservation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL,
  product_id uuid NOT NULL,
  variant_id uuid,
  quantity integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT stock_reservation_items_quantity_check CHECK (quantity > 0)
);

-- public.pos_sales
CREATE TABLE IF NOT EXISTS public.pos_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  customer_name text,
  items jsonb,
  subtotal numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  discount_reason text,
  total numeric NOT NULL,
  payment_method text NOT NULL
    CHECK (payment_method = ANY (ARRAY['efectivo'::text, 'tarjeta'::text, 'transferencia'::text, 'mixto'::text])),
  payment_status text DEFAULT 'paid'::text
    CHECK (payment_status = ANY (ARRAY['paid'::text, 'pending'::text, 'partial'::text])),
  amount_received numeric,
  change_amount numeric,
  notes text,
  channel text DEFAULT 'pos'::text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- public.pos_sale_payments
CREATE TABLE IF NOT EXISTS public.pos_sale_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  method text NOT NULL
    CHECK (method = ANY (ARRAY['efectivo'::text, 'tarjeta'::text, 'transferencia'::text])),
  amount numeric NOT NULL
);

-- public.pos_cash_events
CREATE TABLE IF NOT EXISTS public.pos_cash_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL
    CHECK (type = ANY (ARRAY['sale'::text, 'cashup'::text, 'expense'::text, 'income'::text])),
  amount numeric,
  payment_method text
    CHECK (payment_method = ANY (ARRAY['efectivo'::text, 'tarjeta'::text, 'transferencia'::text])),
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- public.pos_bogo_offers
CREATE TABLE IF NOT EXISTS public.pos_bogo_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  product_id uuid,
  variant_id uuid,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 3) Foreign keys
-- ============================================================

-- profiles -> auth.users
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users (id);

-- products -> categories
ALTER TABLE public.products
  ADD CONSTRAINT products_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES public.categories (id);

ALTER TABLE public.product_skus
  ADD CONSTRAINT product_skus_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products (id);

ALTER TABLE public.product_option_types
  ADD CONSTRAINT product_option_types_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products (id);

ALTER TABLE public.product_option_values
  ADD CONSTRAINT product_option_values_option_type_id_fkey
  FOREIGN KEY (option_type_id) REFERENCES public.product_option_types (id);

ALTER TABLE public.sku_option_values
  ADD CONSTRAINT sku_option_values_option_value_id_fkey
  FOREIGN KEY (option_value_id) REFERENCES public.product_option_values (id);

ALTER TABLE public.sku_option_values
  ADD CONSTRAINT sku_option_values_sku_id_fkey
  FOREIGN KEY (sku_id) REFERENCES public.product_skus (id);

ALTER TABLE public.orders
  ADD CONSTRAINT orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles (id);

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders (id);

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products (id);

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES public.product_skus (id);

ALTER TABLE public.stock_reservations
  ADD CONSTRAINT stock_reservations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles (id);

ALTER TABLE public.stock_reservation_items
  ADD CONSTRAINT stock_reservation_items_reservation_id_fkey
  FOREIGN KEY (reservation_id) REFERENCES public.stock_reservations (id);

ALTER TABLE public.stock_reservation_items
  ADD CONSTRAINT stock_reservation_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products (id);

ALTER TABLE public.stock_reservation_items
  ADD CONSTRAINT stock_reservation_items_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES public.product_skus (id);

ALTER TABLE public.pos_sales
  ADD CONSTRAINT pos_sales_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES public.profiles (id);

ALTER TABLE public.pos_sale_payments
  ADD CONSTRAINT pos_sale_payments_sale_id_fkey
  FOREIGN KEY (sale_id) REFERENCES public.pos_sales (id);

ALTER TABLE public.pos_cash_events
  ADD CONSTRAINT pos_cash_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles (id);

ALTER TABLE public.pos_bogo_offers
  ADD CONSTRAINT pos_bogo_offers_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products (id);

ALTER TABLE public.pos_bogo_offers
  ADD CONSTRAINT pos_bogo_offers_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES public.product_skus (id);

-- ============================================================
-- 4) Enable RLS + policies
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_cash_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_bogo_offers ENABLE ROW LEVEL SECURITY;

-- NOTE: policies may already exist; if they do, CREATE POLICY will fail.
-- If your DB isn't truly blank, we will need the migration to be idempotent (DROP POLICY IF EXISTS).

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert own profile"
  ON public.profiles FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Categories are viewable by everyone."
  ON public.categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Administrators can manage categories."
  ON public.categories FOR ALL
  TO public
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

CREATE POLICY "Active products are viewable by everyone."
  ON public.products FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "All products are viewable by admins."
  ON public.products FOR SELECT
  TO public
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

CREATE POLICY "Administrators can manage products."
  ON public.products FOR ALL
  TO public
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

CREATE POLICY "Users can view their own orders."
  ON public.orders FOR SELECT
  TO public
  USING (
    (auth.uid() = user_id)
    OR (
      ( SELECT profiles.role
        FROM public.profiles
        WHERE (public.profiles.id = auth.uid())
      ) = 'administrador'::public.user_role
    )
  );

CREATE POLICY "Users can create their own orders."
  ON public.orders FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Administrators can manage orders."
  ON public.orders FOR UPDATE
  TO public
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

CREATE POLICY "Users can view items from their own orders."
  ON public.order_items FOR SELECT
  TO public
  USING (
    (EXISTS (
      SELECT 1
      FROM public.orders
      WHERE (public.orders.id = public.order_items.order_id)
        AND (public.orders.user_id = auth.uid())
    ))
    OR (
      ( SELECT profiles.role
        FROM public.profiles
        WHERE (public.profiles.id = auth.uid())
      ) = 'administrador'::public.user_role
    )
  );

CREATE POLICY "Users can insert items to their own orders."
  ON public.order_items FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE (public.orders.id = public.order_items.order_id)
        AND (public.orders.user_id = auth.uid())
    )
  );

CREATE POLICY "Option types are viewable by everyone."
  ON public.product_option_types FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Option values are viewable by everyone."
  ON public.product_option_values FOR SELECT
  TO public
  USING (true);

CREATE POLICY "SKUs are viewable by everyone."
  ON public.product_skus FOR SELECT
  TO public
  USING (true);

CREATE POLICY "SKU option values are viewable by everyone."
  ON public.sku_option_values FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage option types."
  ON public.product_option_types FOR ALL
  TO public
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

CREATE POLICY "Admins can manage option values."
  ON public.product_option_values FOR ALL
  TO public
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

CREATE POLICY "Admins can manage SKUs."
  ON public.product_skus FOR ALL
  TO public
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

CREATE POLICY "Admins can manage SKU option values."
  ON public.sku_option_values FOR ALL
  TO public
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

CREATE POLICY "Users can view their own reservations."
  ON public.stock_reservations FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending reservations."
  ON public.stock_reservations FOR UPDATE
  TO public
  USING (
    (auth.uid() = user_id) AND (status = 'pending'::text)
  );

CREATE POLICY "Users can view items of their own reservations."
  ON public.stock_reservation_items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.stock_reservations
      WHERE (public.stock_reservations.id = public.stock_reservation_items.reservation_id)
        AND (public.stock_reservations.user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can do everything on pos_sales"
  ON public.pos_sales FOR ALL
  TO authenticated
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

CREATE POLICY "Admins can do everything on pos_sale_payments"
  ON public.pos_sale_payments FOR ALL
  TO authenticated
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

CREATE POLICY "Admins can do everything on pos_cash_events"
  ON public.pos_cash_events FOR ALL
  TO authenticated
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );

CREATE POLICY "Admins can do everything on pos_bogo_offers"
  ON public.pos_bogo_offers FOR ALL
  TO authenticated
  USING (
    ( SELECT profiles.role
      FROM public.profiles
      WHERE (public.profiles.id = auth.uid())
    ) = 'administrador'::public.user_role
  );


-- ============================================================
-- 5) Buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES
('product-images', 'product-images', true);

CREATE POLICY "Anyone can update product images"
  ON "storage"."objects"
  AS permissive
  FOR UPDATE
  TO public
USING ((bucket_id = 'product-images'::text))
WITH CHECK ((bucket_id = 'product-images'::text));

CREATE POLICY "Anyone can view product images"
  ON "storage"."objects"
  AS permissive
  FOR SELECT
  TO public
USING ((bucket_id = 'product-images'::text));

CREATE POLICY "Authenticated users can upload product images"
  ON "storage"."objects"
  AS permissive
  FOR INSERT
  TO authenticated
WITH CHECK ((bucket_id = 'product-images'::text));

COMMIT;
