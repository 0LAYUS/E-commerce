BEGIN;

-- 1. Tables
CREATE TABLE IF NOT EXISTS public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id TEXT UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 8)),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'RECEIVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'DELIVERED', 'CANCELLED')),
    device_model TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    estimated_cost DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.work_order_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    image_url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Storage Bucket for evidence
INSERT INTO storage.buckets (id, name, public) 
VALUES ('work_order_evidence', 'work_order_evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Activation
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_evidence ENABLE ROW LEVEL SECURITY;

-- 4. Policies for work_orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_orders' AND policyname = 'Administrators can manage work orders.') THEN
    CREATE POLICY "Administrators can manage work orders."
      ON public.work_orders FOR ALL
      TO authenticated
      USING (
        ( SELECT profiles.role
          FROM public.profiles
          WHERE (public.profiles.id = auth.uid())
        ) = 'administrador'::public.user_role
      );
  END IF;
END $$;

-- 5. Policies for work_order_evidence
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_order_evidence' AND policyname = 'Administrators can manage work order evidence.') THEN
    CREATE POLICY "Administrators can manage work order evidence."
      ON public.work_order_evidence FOR ALL
      TO authenticated
      USING (
        ( SELECT profiles.role
          FROM public.profiles
          WHERE (public.profiles.id = auth.uid())
        ) = 'administrador'::public.user_role
      );
  END IF;
END $$;

-- 6. Storage Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admin can upload work order evidence') THEN
    CREATE POLICY "Admin can upload work order evidence"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'work_order_evidence' AND 
        ( SELECT profiles.role
          FROM public.profiles
          WHERE (public.profiles.id = auth.uid())
        ) = 'administrador'::public.user_role
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admin can manage work order evidence') THEN
    CREATE POLICY "Admin can manage work order evidence"
      ON storage.objects FOR ALL
      TO authenticated
      USING (
        bucket_id = 'work_order_evidence' AND 
        ( SELECT profiles.role
          FROM public.profiles
          WHERE (public.profiles.id = auth.uid())
        ) = 'administrador'::public.user_role
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public can view work order evidence') THEN
    CREATE POLICY "Public can view work order evidence"
      ON storage.objects FOR SELECT
      TO public
      USING ( bucket_id = 'work_order_evidence' );
  END IF;
END $$;

-- 7. Public RPC for getting work order securely without opening anon RLS
CREATE OR REPLACE FUNCTION get_work_order_public(p_tracking_id TEXT, p_phone TEXT)
RETURNS SETOF public.work_orders
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.work_orders 
  WHERE tracking_id = p_tracking_id 
    AND customer_phone = p_phone;
$$;

-- Grant execution to anon
GRANT EXECUTE ON FUNCTION get_work_order_public(TEXT, TEXT) TO anon, authenticated;

-- And for evidence (needs the work_order_id, which they can only get if they passed the previous check)
CREATE OR REPLACE FUNCTION get_work_order_evidence_public(p_work_order_id UUID, p_tracking_id TEXT, p_phone TEXT)
RETURNS SETOF public.work_order_evidence
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT e.* FROM public.work_order_evidence e
  JOIN public.work_orders w ON w.id = e.work_order_id
  WHERE e.work_order_id = p_work_order_id
    AND w.tracking_id = p_tracking_id
    AND w.customer_phone = p_phone;
$$;

GRANT EXECUTE ON FUNCTION get_work_order_evidence_public(UUID, TEXT, TEXT) TO anon, authenticated;

COMMIT;
