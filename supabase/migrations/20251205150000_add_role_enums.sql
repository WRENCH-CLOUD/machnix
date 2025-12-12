-- <timestamp>_rls_role_based_migration.sql
-- Role-based RLS policies for tenant.* tables and selected public tables (platform_admins)
-- Assumptions:
-- 1) JWT contains 'role' and 'tenant_id' claims: auth.jwt()->>'role', auth.jwt()->>'tenant_id'
-- 2) service_role and platform_admin are global roles that bypass tenant isolation
-- 3) Use caution: test in a staging environment before applying to production

-- Helper: list of privileged global roles
-- (No DB object for list; policies inline-check strings: 'service_role', 'platform_admin')

-----------------------------
-- Utility: enable RLS on tables
-----------------------------
-- Ensure RLS is enabled for each table we apply policies to.
ALTER TABLE IF EXISTS tenant.tenants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.vehicles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.jobcards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.estimates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.payment_transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS tenant.parts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.part_usages   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS tenant.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.activities    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS tenant.dvi_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_admins ENABLE ROW LEVEL SECURITY;

-----------------------------
-- Ensure enum types have all needed values
-----------------------------
-- Note: tenant.roles already exists from initial schema
-- We just need to add any missing values if they don't exist

-- Add missing values to tenant.roles enum
DO $$ 
BEGIN
    -- Add 'frontdesk' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'tenant.roles'::regtype 
        AND enumlabel = 'frontdesk'
    ) THEN
        ALTER TYPE tenant.roles ADD VALUE 'frontdesk';
    END IF;
    
    -- Add 'manager' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'tenant.roles'::regtype 
        AND enumlabel = 'manager'
    ) THEN
        ALTER TYPE tenant.roles ADD VALUE 'manager';
    END IF;
END $$;

-- Create enum type for platform admin roles (no enum exists yet for platform_admins)
DO $$ BEGIN
    CREATE TYPE public.platform_admin_role AS ENUM ('admin', 'platform_admin', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-----------------------------
-- Helper note:
-- Replace 'service_role' / 'platform_admin' strings with the exact claim values you use in your JWTs.
-- Example checks used throughout:
--   (auth.jwt() ->> 'role') = 'service_role'
--   OR (auth.jwt() ->> 'role') = 'platform_admin'
-- Tenant-level check used throughout:
--   (auth.jwt() ->> 'tenant_id') = tenant_id::text
-----------------------------

-- Alter existing platform_admins.role column to use enum type (if column exists)
-- Note: The column already exists from previous migration, so we just change its type
DO $$ 
BEGIN
    -- Check if column exists and is not already the enum type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'platform_admins' 
        AND column_name = 'role'
        AND data_type != 'USER-DEFINED'
    ) THEN
        -- Drop the check constraint first
        ALTER TABLE public.platform_admins DROP CONSTRAINT IF EXISTS platform_admins_role_check;
        
        -- Drop the default value temporarily
        ALTER TABLE public.platform_admins ALTER COLUMN role DROP DEFAULT;
        
        -- Alter column type to enum
        ALTER TABLE public.platform_admins 
            ALTER COLUMN role TYPE public.platform_admin_role 
            USING role::public.platform_admin_role;
        
        -- Set the new default with correct enum type
        ALTER TABLE public.platform_admins 
            ALTER COLUMN role SET DEFAULT 'admin'::public.platform_admin_role;
    END IF;
END $$;

-----------------------------
-- GENERIC ROLE PREDICATES (inline used in policies)
-- privileged: service_role OR platform_admin
-- tenant_admin_roles: tenant, admin
-- tenant_user_roles: tenant, admin, frontdesk, mechanic
-----------------------------

-----------------------------
-- TENANTS TABLE
-- Only global privileged roles (service_role/platform_admin) can list all tenants.
-- Tenant owners/admins can SELECT their own tenant row.
-- INSERTs restricted to privileged roles or JWT tenant_id matches.
-----------------------------
DROP POLICY IF EXISTS tenants_select ON tenant.tenants;
CREATE POLICY tenants_select
  ON tenant.tenants
  FOR SELECT
  USING (
    ((auth.jwt() ->> 'role') = 'service_role')
    OR ((auth.jwt() ->> 'role') = 'platform_admin')
    OR ((auth.jwt() ->> 'tenant_id') = id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin'))
  );

DROP POLICY IF EXISTS tenants_insert ON tenant.tenants;
CREATE POLICY tenants_insert
  ON tenant.tenants
  FOR INSERT
  WITH CHECK (
    ((auth.jwt() ->> 'role') = 'service_role')
    OR ((auth.jwt() ->> 'role') = 'platform_admin')
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant.users(role);

-- Only create index for platform_admins if the table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'platform_admins'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_platform_admins_role ON public.platform_admins(role);
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TYPE tenant.roles IS 'Roles available for tenant users: admin, tenant (garage owner), mechanic (technician), employee, frontdesk, manager';
COMMENT ON TYPE public.platform_admin_role IS 'Roles available for platform administrators: admin (full platform access), platform_admin, employee';
COMMENT ON COLUMN tenant.users.role IS 'User role within the tenant using enum type for data integrity';
COMMENT ON COLUMN public.platform_admins.role IS 'Platform admin role using enum type for data integrity';
