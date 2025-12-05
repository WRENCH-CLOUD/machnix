-- Create platform_admins table in public schema
-- This table stores super admin users who have access to the platform-wide admin dashboard

CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX idx_platform_admins_auth_user_id ON public.platform_admins(auth_user_id);
CREATE INDEX idx_platform_admins_email ON public.platform_admins(email);
CREATE INDEX idx_platform_admins_is_active ON public.platform_admins(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_platform_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_platform_admins_updated_at
    BEFORE UPDATE ON public.platform_admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_platform_admins_updated_at();

-- Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_admins
-- Only platform admins can read the platform_admins table
CREATE POLICY "Platform admins can read all platform_admins"
    ON public.platform_admins
    FOR SELECT
    USING (
        auth.uid() IN (SELECT auth_user_id FROM public.platform_admins WHERE is_active = true)
    );

-- Only platform admins can insert new platform admins
CREATE POLICY "Platform admins can insert platform_admins"
    ON public.platform_admins
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (SELECT auth_user_id FROM public.platform_admins WHERE is_active = true)
    );

-- Only platform admins can update platform admins
CREATE POLICY "Platform admins can update platform_admins"
    ON public.platform_admins
    FOR UPDATE
    USING (
        auth.uid() IN (SELECT auth_user_id FROM public.platform_admins WHERE is_active = true)
    );

-- Service role bypass (for initial setup and admin operations)
CREATE POLICY "Service role has full access to platform_admins"
    ON public.platform_admins
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;

-- Add comment
COMMENT ON TABLE public.platform_admins IS 'Platform-wide administrators who have access to super admin dashboard';
