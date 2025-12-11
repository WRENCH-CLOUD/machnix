-- 20251205142602_create_platform_admins_fixed.sql
-- Cleaned, idempotent migration for platform_admins

-- Ensure pgcrypto exists (for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create/update generic updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Foreign keys (idempotent approach: drop if exists then add)
ALTER TABLE public.platform_admins
  DROP CONSTRAINT IF EXISTS platform_admins_auth_user_id_fkey,
  DROP CONSTRAINT IF EXISTS platform_admins_created_by_fkey;

ALTER TABLE public.platform_admins
  ADD CONSTRAINT platform_admins_auth_user_id_fkey
    FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT platform_admins_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Attach trigger (idempotent: drop existing trigger if present)
DROP TRIGGER IF EXISTS trigger_update_platform_admins_updated_at ON public.platform_admins;
CREATE TRIGGER trigger_update_platform_admins_updated_at
  BEFORE UPDATE ON public.platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS (idempotent)
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS platform_admins_service_role_all ON public.platform_admins;
DROP POLICY IF EXISTS platform_admins_select_for_admins ON public.platform_admins;
DROP POLICY IF EXISTS platform_admins_insert_for_admins ON public.platform_admins;
DROP POLICY IF EXISTS platform_admins_update_for_admins ON public.platform_admins;

-- Policy: service_role (full access) via JWT claim
-- Note: Supabase service role often has elevated privileges; using this JWT claim lets you bypass RLS for service tokens.
CREATE POLICY platform_admins_service_role_all
  ON public.platform_admins
  FOR ALL
  USING ( (auth.jwt() ->> 'role') = 'service_role' );

-- Policy: allow active platform admins (by auth_user_id) to SELECT
CREATE POLICY platform_admins_select_for_admins
  ON public.platform_admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.auth_user_id = auth.uid() AND pa.is_active = true
    )
    OR (auth.jwt() ->> 'role') = 'service_role'
  );

-- Policy: allow active platform admins to INSERT (they can insert new admins)
CREATE POLICY platform_admins_insert_for_admins
  ON public.platform_admins
  FOR INSERT
  WITH CHECK (
    ( (auth.jwt() ->> 'role') = 'service_role' )
    OR (
      EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.auth_user_id = auth.uid() AND pa.is_active = true
      )
    )
  );

-- Policy: allow active platform admins to UPDATE their record or others
CREATE POLICY platform_admins_update_for_admins
  ON public.platform_admins
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.auth_user_id = auth.uid() AND pa.is_active = true
    )
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.auth_user_id = auth.uid() AND pa.is_active = true
    )
  );

-- Grants: allow authenticated to SELECT/INSERT/UPDATE subject to RLS policies
GRANT SELECT, INSERT, UPDATE ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;

COMMENT ON TABLE public.platform_admins IS 'Platform-wide administrators who have access to super admin dashboard';
