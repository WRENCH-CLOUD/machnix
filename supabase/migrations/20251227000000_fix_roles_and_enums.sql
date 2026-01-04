-- Fix missing roles and ENUM values
-- This migration ensures that PostgreSQL roles exist for our custom JWT roles
-- and that the tenant.roles ENUM includes all necessary values.

-- 1. Create PostgreSQL roles if they don't exist
-- We use a DO block because CREATE ROLE doesn't support IF NOT EXISTS in all PG versions
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant') THEN
    CREATE ROLE tenant;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_owner') THEN
    CREATE ROLE tenant_owner;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_admin') THEN
    CREATE ROLE tenant_admin;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'manager') THEN
    CREATE ROLE manager;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mechanic') THEN
    CREATE ROLE mechanic;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'frontdesk') THEN
    CREATE ROLE frontdesk;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'platform_admin') THEN
    CREATE ROLE platform_admin;
  END IF;
END
$$;

-- 2. Grant permissions to these roles
-- In Supabase, the 'authenticator' role must be able to switch to these roles
GRANT tenant TO authenticator;
GRANT tenant_owner TO authenticator;
GRANT tenant_admin TO authenticator;
GRANT manager TO authenticator;
GRANT mechanic TO authenticator;
GRANT frontdesk TO authenticator;
GRANT platform_admin TO authenticator;

-- These roles should inherit permissions from the 'authenticated' role
GRANT authenticated TO tenant;
GRANT authenticated TO tenant_owner;
GRANT authenticated TO tenant_admin;
GRANT authenticated TO manager;
GRANT authenticated TO mechanic;
GRANT authenticated TO frontdesk;
GRANT authenticated TO platform_admin;

-- 3. Update tenant.roles ENUM with missing values
-- Note: ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block in some PG versions
-- but Supabase migrations usually run fine if they are not wrapped in a single transaction or if handled correctly.
-- We'll use DO blocks to check if values exist first.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'roles' AND e.enumlabel = 'tenant_owner') THEN
    ALTER TYPE tenant.roles ADD VALUE 'tenant_owner';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'roles' AND e.enumlabel = 'tenant_admin') THEN
    ALTER TYPE tenant.roles ADD VALUE 'tenant_admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'roles' AND e.enumlabel = 'manager') THEN
    ALTER TYPE tenant.roles ADD VALUE 'manager';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'roles' AND e.enumlabel = 'mechanic') THEN
    ALTER TYPE tenant.roles ADD VALUE 'mechanic';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'roles' AND e.enumlabel = 'frontdesk') THEN
    ALTER TYPE tenant.roles ADD VALUE 'frontdesk';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'roles' AND e.enumlabel = 'admin') THEN
    ALTER TYPE tenant.roles ADD VALUE 'admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'roles' AND e.enumlabel = 'employee') THEN
    ALTER TYPE tenant.roles ADD VALUE 'employee';
  END IF;
END
$$;
