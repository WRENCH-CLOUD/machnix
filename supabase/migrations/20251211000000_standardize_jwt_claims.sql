-- ============================================================================
-- JWT Claims Standardization Migration
-- ============================================================================
-- This migration standardizes all RLS policies to use consistent JWT claim names
-- 
-- JWT Claims Used:
--   - auth.jwt() ->> 'role'       - User's role (tenant_owner, platform_admin, etc.)
--   - auth.jwt() ->> 'tenant_id'  - User's tenant ID (UUID string)
--
-- Role Values:
--   - 'service_role'     - Service role (bypasses RLS, unlimited access)
--   - 'platform_admin'   - Platform administrator (cross-tenant access)
--   - 'tenant_owner'     - Tenant owner (full access within tenant)
--   - 'tenant_admin'     - Tenant administrator (full access within tenant)
--   - 'manager'          - Manager (manage jobs, customers, reports)
--   - 'mechanic'         - Mechanic (work on jobs)
--   - 'frontdesk'        - Front desk (create jobs, interact with customers)
--   - 'employee'         - Employee (basic limited access)
--
-- HOW JWT CLAIMS WORK:
-- ====================
-- 1. When a user is created via Supabase Admin API, we set their app_metadata:
--    await supabaseAdmin.auth.admin.updateUserById(userId, {
--      app_metadata: { role: 'tenant_owner', tenant_id: '<UUID>' }
--    })
--
-- 2. Supabase automatically embeds app_metadata into the user's JWT
--
-- 3. RLS policies can access these claims via auth.jwt():
--    (auth.jwt() ->> 'role') = 'tenant_owner'
--    (auth.jwt() ->> 'tenant_id') = tenant_id::text
--
-- 4. The JWT is automatically refreshed when app_metadata changes
--
-- SECURITY:
-- =========
-- - Only server-side code with service_role key can modify app_metadata
-- - Clients CANNOT set their own JWT claims
-- - This ensures role and tenant_id are trusted
-- ============================================================================

-- Drop all existing RLS policies to rebuild them with standardized claims
DROP POLICY IF EXISTS platform_admins_service_role_all ON public.platform_admins;
DROP POLICY IF EXISTS tenants_select ON tenant.tenants;
DROP POLICY IF EXISTS tenants_insert ON tenant.tenants;
DROP POLICY IF EXISTS tenants_update ON tenant.tenants;
DROP POLICY IF EXISTS users_select ON tenant.users;
DROP POLICY IF EXISTS users_insert ON tenant.users;
DROP POLICY IF EXISTS users_update ON tenant.users;
DROP POLICY IF EXISTS users_delete ON tenant.users;

-- ============================================================================
-- PLATFORM ADMINS (public.platform_admins)
-- ============================================================================
-- Platform admins can be accessed by:
-- 1. service_role (bypasses RLS)
-- 2. Users with role='platform_admin' in JWT
-- 3. Users who have an active entry in platform_admins table

CREATE POLICY platform_admins_all
  ON public.platform_admins
  FOR ALL
  USING (
    -- Service role has full access
    (auth.jwt() ->> 'role') = 'service_role'
    OR
    -- Platform admins have full access
    (auth.jwt() ->> 'role') = 'platform_admin'
    OR
    -- Users can access their own record
    EXISTS (
      SELECT 1 
      FROM public.platform_admins pa
      WHERE pa.auth_user_id = auth.uid() 
        AND pa.is_active = true
    )
  )
  WITH CHECK (
    -- Same rules for INSERT/UPDATE
    (auth.jwt() ->> 'role') = 'service_role'
    OR
    (auth.jwt() ->> 'role') = 'platform_admin'
  );

-- ============================================================================
-- TENANTS (tenant.tenants)
-- ============================================================================
-- Access rules:
-- SELECT: service_role, platform_admin, or tenant owner/admin of that tenant
-- INSERT: service_role, platform_admin only
-- UPDATE: service_role, platform_admin, or tenant owner/admin of that tenant

CREATE POLICY tenants_select
  ON tenant.tenants
  FOR SELECT
  USING (
    -- Privileged global roles
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    -- Tenant owner/admin can see their own tenant
    (
      (auth.jwt() ->> 'tenant_id') = id::text 
      AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin')
    )
  );

CREATE POLICY tenants_insert
  ON tenant.tenants
  FOR INSERT
  WITH CHECK (
    -- Only privileged roles can create tenants
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
  );

CREATE POLICY tenants_update
  ON tenant.tenants
  FOR UPDATE
  USING (
    -- Privileged global roles
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    -- Tenant owner/admin can update their own tenant
    (
      (auth.jwt() ->> 'tenant_id') = id::text 
      AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin')
    )
  )
  WITH CHECK (
    -- Same as USING
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (
      (auth.jwt() ->> 'tenant_id') = id::text 
      AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin')
    )
  );

-- ============================================================================
-- USERS (tenant.users)
-- ============================================================================
-- Access rules:
-- SELECT: service_role, platform_admin, tenant owner/admin/manager, or own record
-- INSERT: service_role, platform_admin, tenant owner/admin
-- UPDATE: service_role, platform_admin, tenant owner/admin, or own record
-- DELETE: service_role, platform_admin, tenant owner/admin only

CREATE POLICY users_select
  ON tenant.users
  FOR SELECT
  USING (
    -- Privileged global roles
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    -- Tenant owner/admin/manager can see all users in their tenant
    (
      (auth.jwt() ->> 'tenant_id') = tenant_id::text 
      AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin', 'manager')
    )
    OR
    -- Users can see their own record
    auth_user_id = auth.uid()
  );

CREATE POLICY users_insert
  ON tenant.users
  FOR INSERT
  WITH CHECK (
    -- Privileged global roles
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    -- Tenant owner/admin can create users in their tenant
    (
      (auth.jwt() ->> 'tenant_id') = tenant_id::text 
      AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin')
    )
  );

CREATE POLICY users_update
  ON tenant.users
  FOR UPDATE
  USING (
    -- Privileged global roles
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    -- Tenant owner/admin can update users in their tenant
    (
      (auth.jwt() ->> 'tenant_id') = tenant_id::text 
      AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin')
    )
    OR
    -- Users can update their own record (limited fields)
    auth_user_id = auth.uid()
  )
  WITH CHECK (
    -- Same as USING
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (
      (auth.jwt() ->> 'tenant_id') = tenant_id::text 
      AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin')
    )
    OR
    auth_user_id = auth.uid()
  );

CREATE POLICY users_delete
  ON tenant.users
  FOR DELETE
  USING (
    -- Privileged global roles
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    -- Tenant owner/admin can delete users in their tenant
    (
      (auth.jwt() ->> 'tenant_id') = tenant_id::text 
      AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin')
    )
  );

-- ============================================================================
-- CUSTOMERS (tenant.customers)
-- ============================================================================
-- All tenant users can read/write customers in their tenant

DROP POLICY IF EXISTS customers_select ON tenant.customers;
DROP POLICY IF EXISTS customers_insert ON tenant.customers;
DROP POLICY IF EXISTS customers_update ON tenant.customers;
DROP POLICY IF EXISTS customers_delete ON tenant.customers;

CREATE POLICY customers_select
  ON tenant.customers
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY customers_insert
  ON tenant.customers
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY customers_update
  ON tenant.customers
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY customers_delete
  ON tenant.customers
  FOR DELETE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

-- ============================================================================
-- VEHICLES (tenant.vehicles)
-- ============================================================================

DROP POLICY IF EXISTS vehicles_select ON tenant.vehicles;
DROP POLICY IF EXISTS vehicles_insert ON tenant.vehicles;
DROP POLICY IF EXISTS vehicles_update ON tenant.vehicles;
DROP POLICY IF EXISTS vehicles_delete ON tenant.vehicles;

CREATE POLICY vehicles_select
  ON tenant.vehicles
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY vehicles_insert
  ON tenant.vehicles
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY vehicles_update
  ON tenant.vehicles
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY vehicles_delete
  ON tenant.vehicles
  FOR DELETE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

-- ============================================================================
-- JOBCARDS (tenant.jobcards)
-- ============================================================================

DROP POLICY IF EXISTS jobcards_select ON tenant.jobcards;
DROP POLICY IF EXISTS jobcards_insert ON tenant.jobcards;
DROP POLICY IF EXISTS jobcards_update ON tenant.jobcards;
DROP POLICY IF EXISTS jobcards_delete ON tenant.jobcards;

CREATE POLICY jobcards_select
  ON tenant.jobcards
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY jobcards_insert
  ON tenant.jobcards
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY jobcards_update
  ON tenant.jobcards
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY jobcards_delete
  ON tenant.jobcards
  FOR DELETE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

-- ============================================================================
-- ESTIMATES (tenant.estimates)
-- ============================================================================

DROP POLICY IF EXISTS estimates_select ON tenant.estimates;
DROP POLICY IF EXISTS estimates_insert ON tenant.estimates;
DROP POLICY IF EXISTS estimates_update ON tenant.estimates;
DROP POLICY IF EXISTS estimates_delete ON tenant.estimates;

CREATE POLICY estimates_select
  ON tenant.estimates
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY estimates_insert
  ON tenant.estimates
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY estimates_update
  ON tenant.estimates
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY estimates_delete
  ON tenant.estimates
  FOR DELETE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

-- ============================================================================
-- INVOICES (tenant.invoices)
-- ============================================================================

DROP POLICY IF EXISTS invoices_select ON tenant.invoices;
DROP POLICY IF EXISTS invoices_insert ON tenant.invoices;
DROP POLICY IF EXISTS invoices_update ON tenant.invoices;
DROP POLICY IF EXISTS invoices_delete ON tenant.invoices;

CREATE POLICY invoices_select
  ON tenant.invoices
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY invoices_insert
  ON tenant.invoices
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY invoices_update
  ON tenant.invoices
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

CREATE POLICY invoices_delete
  ON tenant.invoices
  FOR DELETE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

-- ============================================================================
-- NOTES & INSTRUCTIONS
-- ============================================================================
-- After running this migration:
--
-- 1. Update all existing users to have proper app_metadata:
--    - Use setUserJwtClaims() or setTenantUserClaims() functions
--    - Example: await setTenantUserClaims(admin, userId, 'tenant_owner', tenantId)
--
-- 2. Test RLS policies:
--    - Login as different roles (platform_admin, tenant_owner, mechanic, etc.)
--    - Verify users can only access their tenant's data
--    - Verify platform_admins can access all data
--
-- 3. Update any remaining tables (payments, notifications, activities, etc.)
--    following the same pattern
-- ============================================================================
