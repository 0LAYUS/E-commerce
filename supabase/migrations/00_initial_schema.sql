-- Custom Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('cliente', 'administrador');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'ERROR');
    END IF;
END $$;

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role DEFAULT 'cliente'::user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
CREATE POLICY "Authenticated users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, 'sin-correo@ecommerce.com'), 
    CASE WHEN is_first_user THEN 'administrador'::public.user_role ELSE 'cliente'::public.user_role END
  );
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'Error on profile creation trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone." ON public.categories;
CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Administrators can manage categories." ON public.categories;
CREATE POLICY "Administrators can manage categories." ON public.categories FOR ALL 
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

-- 3. Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active products are viewable by everyone." ON public.products;
CREATE POLICY "Active products are viewable by everyone." ON public.products FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "All products are viewable by admins." ON public.products;
CREATE POLICY "All products are viewable by admins." ON public.products FOR SELECT 
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

DROP POLICY IF EXISTS "Administrators can manage products." ON public.products;
CREATE POLICY "Administrators can manage products." ON public.products FOR ALL 
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

-- 4. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total_amount INTEGER NOT NULL,
  status order_status DEFAULT 'PENDING'::order_status NOT NULL,
  wompi_transaction_id TEXT,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT 
  USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador');

DROP POLICY IF EXISTS "Users can create their own orders." ON public.orders;
CREATE POLICY "Users can create their own orders." ON public.orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Administrators can manage orders." ON public.orders;
CREATE POLICY "Administrators can manage orders." ON public.orders FOR UPDATE
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

-- 5. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items from their own orders." ON public.order_items FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE public.orders.id = order_id AND public.orders.user_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'administrador'
  );
CREATE POLICY "Users can insert items to their own orders." ON public.order_items FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE public.orders.id = order_id AND public.orders.user_id = auth.uid())
  );