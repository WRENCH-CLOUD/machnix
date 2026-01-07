-- Migration: Add callback_requests table for landing page callback form
-- This table stores callback requests from potential customers

CREATE TABLE IF NOT EXISTS public.callback_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  business_name text,
  message text,
  status text NOT NULL DEFAULT 'pending', -- pending, contacted, closed
  notes text,  -- admin notes
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  contacted_at timestamptz,
  contacted_by uuid REFERENCES public.platform_admins(id)
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_callback_requests_updated_at ON public.callback_requests;
CREATE TRIGGER trg_callback_requests_updated_at
  BEFORE UPDATE ON public.callback_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamps();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_callback_requests_status ON public.callback_requests(status);
CREATE INDEX IF NOT EXISTS idx_callback_requests_created_at ON public.callback_requests(created_at DESC);

-- RLS
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for public form submission)
DROP POLICY IF EXISTS callback_requests_insert ON public.callback_requests;
CREATE POLICY callback_requests_insert ON public.callback_requests FOR INSERT
  WITH CHECK (true);

-- Only platform admins can select/update/delete
DROP POLICY IF EXISTS callback_requests_select ON public.callback_requests;
CREATE POLICY callback_requests_select ON public.callback_requests FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
  );

DROP POLICY IF EXISTS callback_requests_update ON public.callback_requests;
CREATE POLICY callback_requests_update ON public.callback_requests FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
  );

DROP POLICY IF EXISTS callback_requests_delete ON public.callback_requests;
CREATE POLICY callback_requests_delete ON public.callback_requests FOR DELETE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
  );

-- Grant permissions
GRANT INSERT ON public.callback_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.callback_requests TO authenticated;
GRANT ALL PRIVILEGES ON public.callback_requests TO service_role;
