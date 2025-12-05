-- Migration: Add role enums and convert TEXT columns to use them
-- This migration creates proper enum types for user roles and converts existing columns

-- Create enum for tenant user roles (only tenant and mechanic)
CREATE TYPE tenant.user_role AS ENUM (
    'tenant',
    'mechanic'
);

-- Create enum for platform admin roles (all platform admins are admins)
CREATE TYPE public.platform_admin_role AS ENUM (
    'admin'
);

-- Add new columns with enum types
ALTER TABLE tenant.users 
    ADD COLUMN role_new tenant.user_role;

ALTER TABLE public.platform_admins 
    ADD COLUMN role public.platform_admin_role DEFAULT 'admin'::public.platform_admin_role;

-- Migrate existing data from TEXT to ENUM for tenant.users
-- Map old text values to new enum values
UPDATE tenant.users
SET role_new = CASE 
    WHEN role IN ('admin', 'tenant_admin', 'frontdesk', 'tenant') THEN 'tenant'::tenant.user_role
    WHEN role = 'mechanic' THEN 'mechanic'::tenant.user_role
    ELSE 'tenant'::tenant.user_role  -- Default fallback
END;

-- Drop old TEXT column and rename new column
ALTER TABLE tenant.users DROP COLUMN role;
ALTER TABLE tenant.users RENAME COLUMN role_new TO role;

-- Set NOT NULL constraint and default value
ALTER TABLE tenant.users 
    ALTER COLUMN role SET NOT NULL,
    ALTER COLUMN role SET DEFAULT 'tenant'::tenant.user_role;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant.users(role);
CREATE INDEX IF NOT EXISTS idx_platform_admins_role ON public.platform_admins(role);

-- Add comments for documentation
COMMENT ON TYPE tenant.user_role IS 'Roles available for tenant users: tenant (garage owner/admin), mechanic (technician)';
COMMENT ON TYPE public.platform_admin_role IS 'Roles available for platform administrators: admin (full platform access)';
COMMENT ON COLUMN tenant.users.role IS 'User role within the tenant using enum type for data integrity';
COMMENT ON COLUMN public.platform_admins.role IS 'Platform admin role using enum type for data integrity';
