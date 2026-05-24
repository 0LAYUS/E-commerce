-- ============================================================
-- Fix: Add UPSERT policy for profiles
-- ============================================================
-- The previous migration had separate INSERT and UPDATE policies,
-- but Supabase .upsert() needs a combined policy that allows
-- both inserting a new row AND updating an existing one where
-- id = auth.uid().

-- Drop old policies to replace with a combined one
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Combined UPSERT policy: users can insert or update their own profile
CREATE POLICY "Users can upsert own profile"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Keep the public read policy
-- "Public profiles are viewable by everyone." — already exists, no changes needed
