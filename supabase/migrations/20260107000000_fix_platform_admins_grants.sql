-- Fix missing GRANT permissions for public.platform_admins table
-- This resolves the "permission denied for table platform_admins" error (42501)

-- Grant privileges to service_role (used by the create-platform-admin script)
GRANT ALL PRIVILEGES ON TABLE public.platform_admins TO service_role;

-- Restrict privileges for authenticated users to read-only access to their own data (enforced by RLS)
REVOKE INSERT, UPDATE, DELETE ON TABLE public.platform_admins FROM authenticated;
GRANT SELECT ON TABLE public.platform_admins TO authenticated;

-- Also grant privileges on the platform_admin_role type (for inserts/updates)
GRANT USAGE ON TYPE public.platform_admin_role TO authenticated;
GRANT USAGE ON TYPE public.platform_admin_role TO service_role;
