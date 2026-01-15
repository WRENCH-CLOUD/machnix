-- Migration: Create leads table for demo/callback requests
-- Only accessible by service_role and platform_admins

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create leads table in public schema (not tenant-specific)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  garage_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- Add comment
COMMENT ON TABLE public.leads IS 'Leads from demo request forms - only accessible by service_role and platform_admins';

-- Create updated_at trigger
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only platform_admins can access (service_role bypasses RLS automatically)
-- Policy for platform admins to SELECT
CREATE POLICY "Platform admins can view leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy for platform admins to INSERT (for admin manual entry)
CREATE POLICY "Platform admins can insert leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy for platform admins to UPDATE
CREATE POLICY "Platform admins can update leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy for platform admins to DELETE
CREATE POLICY "Platform admins can delete leads"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = auth.uid()
    )
  );

-- Grant permissions to service_role (bypasses RLS) and authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- Create index for common queries
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_email ON public.leads(email);
