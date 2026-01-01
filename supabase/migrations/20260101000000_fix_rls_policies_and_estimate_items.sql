-- =====================================================
-- MIGRATION: Fix RLS Policy Inconsistencies and Add tenant_id to estimate_items
-- =====================================================
-- 
-- This migration addresses the following issues:
-- 1. RLS policy inconsistency - mechanics table only checks top-level role
-- 2. Missing tenant_id on tenant.estimate_items table
-- 
-- =====================================================

-- =====================================================
-- 1. FIX RLS POLICIES FOR tenant.mechanics
-- =====================================================
-- Update mechanics policies to check both app_metadata.role AND top-level role
-- for consistency with other tables like jobcards

DROP POLICY IF EXISTS mechanics_select ON tenant.mechanics;
CREATE POLICY mechanics_select ON tenant.mechanics FOR SELECT
  USING (
    ( (auth.jwt() ->> 'role') IN ('service_role','platform_admin') )
    OR ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin' )
    OR (
         (auth.jwt() ->> 'tenant_id') = tenant_id::text
         AND (
           (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
           OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
         )
       )
  );

DROP POLICY IF EXISTS mechanics_insert ON tenant.mechanics;
CREATE POLICY mechanics_insert ON tenant.mechanics FOR INSERT
  WITH CHECK (
    ( (auth.jwt() ->> 'role') IN ('service_role','platform_admin') )
    OR ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin' )
    OR (
         (auth.jwt() ->> 'tenant_id') = tenant_id::text
         AND (
           (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk')
           OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
         )
       )
  );

DROP POLICY IF EXISTS mechanics_update ON tenant.mechanics;
CREATE POLICY mechanics_update ON tenant.mechanics FOR UPDATE
  USING (
    ( (auth.jwt() ->> 'role') IN ('service_role','platform_admin') )
    OR ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin' )
    OR (
         (auth.jwt() ->> 'tenant_id') = tenant_id::text
         AND (
           (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk')
           OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
         )
       )
  )
  WITH CHECK (
    ( (auth.jwt() ->> 'role') IN ('service_role','platform_admin') )
    OR ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin' )
    OR (
         (auth.jwt() ->> 'tenant_id') = tenant_id::text
         AND (
           (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk')
           OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
         )
       )
  );

DROP POLICY IF EXISTS mechanics_delete ON tenant.mechanics;
CREATE POLICY mechanics_delete ON tenant.mechanics FOR DELETE
  USING (
    ( (auth.jwt() ->> 'role') IN ('service_role','platform_admin') )
    OR ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin' )
    OR (
         (auth.jwt() ->> 'tenant_id') = tenant_id::text
         AND (
           (auth.jwt() ->> 'role') IN ('tenant','admin')
           OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('tenant','admin')
         )
       )
  );

-- =====================================================
-- 2. ADD tenant_id TO tenant.estimate_items
-- =====================================================
-- This provides direct tenant isolation without requiring joins to estimates table

-- Add tenant_id column
ALTER TABLE tenant.estimate_items 
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Backfill tenant_id from related estimates
UPDATE tenant.estimate_items ei
SET tenant_id = e.tenant_id
FROM tenant.estimates e
WHERE ei.estimate_id = e.id
  AND ei.tenant_id IS NULL;

-- Add NOT NULL constraint after backfill (if data exists)
-- We use a DO block to handle this gracefully
DO $$
BEGIN
  -- Only add NOT NULL if all rows have been backfilled
  IF NOT EXISTS (SELECT 1 FROM tenant.estimate_items WHERE tenant_id IS NULL) THEN
    ALTER TABLE tenant.estimate_items ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END
$$;

-- Add foreign key constraint
ALTER TABLE tenant.estimate_items 
  DROP CONSTRAINT IF EXISTS estimate_items_tenant_id_fkey;
ALTER TABLE tenant.estimate_items 
  ADD CONSTRAINT estimate_items_tenant_id_fkey 
  FOREIGN KEY (tenant_id) 
  REFERENCES tenant.tenants(id) 
  ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_estimate_items_tenant_id ON tenant.estimate_items(tenant_id);

-- =====================================================
-- 3. UPDATE RLS POLICIES FOR tenant.estimate_items
-- =====================================================
-- Now that we have direct tenant_id, update policies to use it directly
-- instead of joining to estimates table (more performant)

DROP POLICY IF EXISTS estimate_items_select ON tenant.estimate_items;
CREATE POLICY estimate_items_select ON tenant.estimate_items FOR SELECT
  USING (
    ( (auth.jwt() ->> 'role') IN ('service_role','platform_admin') )
    OR ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin' )
    OR (
         (auth.jwt() ->> 'tenant_id') = tenant_id::text
         AND (
           (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk')
           OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
         )
       )
  );

DROP POLICY IF EXISTS estimate_items_insert ON tenant.estimate_items;
CREATE POLICY estimate_items_insert ON tenant.estimate_items FOR INSERT
  WITH CHECK (
    ( (auth.jwt() ->> 'role') IN ('service_role','platform_admin') )
    OR ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin' )
    OR (
         (auth.jwt() ->> 'tenant_id') = tenant_id::text
         AND (
           (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk')
           OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
         )
       )
  );

DROP POLICY IF EXISTS estimate_items_update ON tenant.estimate_items;
CREATE POLICY estimate_items_update ON tenant.estimate_items FOR UPDATE
  USING (
    ( (auth.jwt() ->> 'role') IN ('service_role','platform_admin') )
    OR ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin' )
    OR (
         (auth.jwt() ->> 'tenant_id') = tenant_id::text
         AND (
           (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk')
           OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
         )
       )
  )
  WITH CHECK (
    ( (auth.jwt() ->> 'role') IN ('service_role','platform_admin') )
    OR ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin' )
    OR (
         (auth.jwt() ->> 'tenant_id') = tenant_id::text
         AND (
           (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk')
           OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
         )
       )
  );

DROP POLICY IF EXISTS estimate_items_delete ON tenant.estimate_items;
CREATE POLICY estimate_items_delete ON tenant.estimate_items FOR DELETE
  USING (
    ( (auth.jwt() ->> 'role') IN ('service_role','platform_admin') )
    OR ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin' )
    OR (
         (auth.jwt() ->> 'tenant_id') = tenant_id::text
         AND (
           (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk')
           OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
         )
       )
  );

-- End of migration
