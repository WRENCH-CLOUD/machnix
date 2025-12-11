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
-- Helper note:
-- Replace 'service_role' / 'platform_admin' strings with the exact claim values you use in your JWTs.
-- Example checks used throughout:
--   (auth.jwt() ->> 'role') = 'service_role'
--   OR (auth.jwt() ->> 'role') = 'platform_admin'
-- Tenant-level check used throughout:
--   (auth.jwt() ->> 'tenant_id') = tenant_id::text
-----------------------------

<<<<<<< Updated upstream
ALTER TABLE public.platform_admins 
    ADD COLUMN role public.platform_admin_role DEFAULT 'admin'::public.platform_admin_role;
=======
-----------------------------
-- PLATFORM ADMINS (public.platform_admins)
-- Global admin table: platform_admins should be readable/updatable by platform_admins and service_role.
-----------------------------
DROP POLICY IF EXISTS platform_admins_service_role_all ON public.platform_admins;
CREATE POLICY platform_admins_service_role_all
  ON public.platform_admins
  FOR ALL
  USING (
    ((auth.jwt() ->> 'role') = 'service_role')
    OR ((auth.jwt() ->> 'role') = 'platform_admin')
    OR EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.auth_user_id = auth.uid() AND pa.is_active = true
    )
  )
  WITH CHECK (
    ((auth.jwt() ->> 'role') = 'service_role')
    OR ((auth.jwt() ->> 'role') = 'platform_admin')
    OR EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.auth_user_id = auth.uid() AND pa.is_active = true
    )
  );
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant.users(role);
CREATE INDEX IF NOT EXISTS idx_platform_admins_role ON public.platform_admins(role);

-- Add comments for documentation
COMMENT ON TYPE tenant.user_role IS 'Roles available for tenant users: tenant (garage owner/admin), mechanic (technician)';
COMMENT ON TYPE public.platform_admin_role IS 'Roles available for platform administrators: admin (full platform access)';
COMMENT ON COLUMN tenant.users.role IS 'User role within the tenant using enum type for data integrity';
COMMENT ON COLUMN public.platform_admins.role IS 'Platform admin role using enum type for data integrity';
=======
DROP POLICY IF EXISTS tenants_update ON tenant.tenants;
CREATE POLICY tenants_update
  ON tenant.tenants
  FOR UPDATE
  USING (
    ((auth.jwt() ->> 'role') = 'service_role')
    OR ((auth.jwt() ->> 'role') = 'platform_admin')
    OR ((auth.jwt() ->> 'tenant_id') = id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin'))
  )
  WITH CHECK (
    ((auth.jwt() ->> 'role') = 'service_role')
    OR ((auth.jwt() ->> 'role') = 'platform_admin')
    OR ((auth.jwt() ->> 'tenant_id') = id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin'))
  );

-----------------------------
-- USERS (tenant.users)
-- Rules:
--  - service_role / platform_admin: full access
--  - tenant / admin: full access within same tenant
--  - an authenticated user can see/modify their own tenant.user row (auth_uid == auth_user_id)
-----------------------------
DROP POLICY IF EXISTS users_select ON tenant.users;
CREATE POLICY users_select
  ON tenant.users
  FOR SELECT
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin'))
    OR (auth.uid() = auth_user_id)
  );

DROP POLICY IF EXISTS users_insert ON tenant.users;
CREATE POLICY users_insert
  ON tenant.users
  FOR INSERT
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin'))
  );

DROP POLICY IF EXISTS users_update ON tenant.users;
CREATE POLICY users_update
  ON tenant.users
  FOR UPDATE
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin'))
    OR (auth.uid() = auth_user_id)    -- allow user update own row within limits
  )
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin'))
    OR (auth.uid() = auth_user_id)
  );

DROP POLICY IF EXISTS users_delete ON tenant.users;
CREATE POLICY users_delete
  ON tenant.users
  FOR DELETE
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') = 'tenant')
  );

-----------------------------
-- CUSTOMERS
-- tenant scoped: tenant/admin/frontdesk can manage customers
-- mechanics may read customer basic info
-----------------------------
DROP POLICY IF EXISTS customers_select ON tenant.customers;
CREATE POLICY customers_select
  ON tenant.customers
  FOR SELECT
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk','mechanic'))
  );

DROP POLICY IF EXISTS customers_insert ON tenant.customers;
CREATE POLICY customers_insert
  ON tenant.customers
  FOR INSERT
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
  );

DROP POLICY IF EXISTS customers_update ON tenant.customers;
CREATE POLICY customers_update
  ON tenant.customers
  FOR UPDATE
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
  )
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
  );

DROP POLICY IF EXISTS customers_delete ON tenant.customers;
CREATE POLICY customers_delete
  ON tenant.customers
  FOR DELETE
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') = 'tenant')
  );

-----------------------------
-- VEHICLES
-- tenant scoped; frontdesk/mechanic/admin/owner can select; insert/update restricted to frontdesk/admin/owner
-----------------------------
DROP POLICY IF EXISTS vehicles_select ON tenant.vehicles;
CREATE POLICY vehicles_select
  ON tenant.vehicles
  FOR SELECT
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk','mechanic'))
  );

DROP POLICY IF EXISTS vehicles_insert ON tenant.vehicles;
CREATE POLICY vehicles_insert
  ON tenant.vehicles
  FOR INSERT
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
  );

DROP POLICY IF EXISTS vehicles_update ON tenant.vehicles;
CREATE POLICY vehicles_update
  ON tenant.vehicles
  FOR UPDATE
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
  )
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
  );

DROP POLICY IF EXISTS vehicles_delete ON tenant.vehicles;
CREATE POLICY vehicles_delete
  ON tenant.vehicles
  FOR DELETE
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') = 'tenant')
  );

-----------------------------
-- JOBCARDS
-- Read by tenant staff; create by frontdesk/admin/owner; update by assigned mechanic or admin/owner
-----------------------------
DROP POLICY IF EXISTS jobcards_select ON tenant.jobcards;
CREATE POLICY jobcards_select
  ON tenant.jobcards
  FOR SELECT
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk','mechanic'))
  );

DROP POLICY IF EXISTS jobcards_insert ON tenant.jobcards;
CREATE POLICY jobcards_insert
  ON tenant.jobcards
  FOR INSERT
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
  );

DROP POLICY IF EXISTS jobcards_update ON tenant.jobcards;
CREATE POLICY jobcards_update
  ON tenant.jobcards
  FOR UPDATE
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR (
      (auth.uid() IS NOT NULL AND assigned_mechanic_id = auth.uid())  -- allow assigned mechanic to update
      OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
    )
  )
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
    OR (auth.uid() IS NOT NULL AND assigned_mechanic_id = auth.uid())
  );

DROP POLICY IF EXISTS jobcards_delete ON tenant.jobcards;
CREATE POLICY jobcards_delete
  ON tenant.jobcards
  FOR DELETE
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') = 'tenant')
  );

-----------------------------
-- ESTIMATES / ESTIMATE_ITEMS
-----------------------------
DROP POLICY IF EXISTS estimates_select ON tenant.estimates;
CREATE POLICY estimates_select
  ON tenant.estimates
  FOR SELECT
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk','mechanic'))
  );

DROP POLICY IF EXISTS estimates_insert ON tenant.estimates;
CREATE POLICY estimates_insert
  ON tenant.estimates
  FOR INSERT
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
  );

DROP POLICY IF EXISTS estimate_items_select ON tenant.estimate_items;
CREATE POLICY estimate_items_select
  ON tenant.estimate_items
  FOR SELECT
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR EXISTS (
      SELECT 1 FROM tenant.estimates e WHERE e.id = estimate_items.estimate_id AND (auth.jwt() ->> 'tenant_id') = e.tenant_id::text
    )
  );

-- Insert/update/delete rules for estimate_items follow estimates policies:
DROP POLICY IF EXISTS estimate_items_insert ON tenant.estimate_items;
CREATE POLICY estimate_items_insert
  ON tenant.estimate_items
  FOR INSERT
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR EXISTS (
      SELECT 1 FROM tenant.estimates e WHERE e.id = estimate_items.estimate_id AND (auth.jwt() ->> 'tenant_id') = e.tenant_id::text
    )
  );

-----------------------------
-- INVOICES / PAYMENTS / PAYMENT_TRANSACTIONS
-- Invoices: tenant staff can read/create; only tenant/admin or service/platform admins can delete
-- Payments: read/insert by tenant staff; delete restricted to privileged roles
-----------------------------
DROP POLICY IF EXISTS invoices_select ON tenant.invoices;
CREATE POLICY invoices_select
  ON tenant.invoices
  FOR SELECT
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk','mechanic'))
  );

DROP POLICY IF EXISTS invoices_insert ON tenant.invoices;
CREATE POLICY invoices_insert
  ON tenant.invoices
  FOR INSERT
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
  );

DROP POLICY IF EXISTS invoices_update ON tenant.invoices;
CREATE POLICY invoices_update
  ON tenant.invoices
  FOR UPDATE
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
  )
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
  );

DROP POLICY IF EXISTS invoices_delete ON tenant.invoices;
CREATE POLICY invoices_delete
  ON tenant.invoices
  FOR DELETE
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') = 'tenant')
  );

-- Payments
DROP POLICY IF EXISTS payments_select ON tenant.payments;
CREATE POLICY payments_select
  ON tenant.payments
  FOR SELECT
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR EXISTS (
      SELECT 1 FROM tenant.invoices i WHERE i.id = payments.invoice_id AND (auth.jwt() ->> 'tenant_id') = i.tenant_id::text
    )
  );

DROP POLICY IF EXISTS payments_insert ON tenant.payments;
CREATE POLICY payments_insert
  ON tenant.payments
  FOR INSERT
  WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR EXISTS (
      SELECT 1 FROM tenant.invoices i WHERE i.id = payments.invoice_id AND (auth.jwt() ->> 'tenant_id') = i.tenant_id::text
    )
  );

DROP POLICY IF EXISTS payments_delete ON tenant.payments;
CREATE POLICY payments_delete
  ON tenant.payments
  FOR DELETE
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR EXISTS (
      SELECT 1 FROM tenant.invoices i WHERE i.id = payments.invoice_id AND (auth.jwt() ->> 'tenant_id') = i.tenant_id::text AND (auth.jwt() ->> 'role') = 'tenant'
    )
  );

-- Payment transactions: similar to payments, but admin-only deletes
DROP POLICY IF EXISTS payment_transactions_select ON tenant.payment_transactions;
CREATE POLICY payment_transactions_select
  ON tenant.payment_transactions
  FOR SELECT
  USING (
    ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
    OR EXISTS (
      SELECT 1 FROM tenant.invoices i WHERE i.id = payment_transactions.invoice_id AND (auth.jwt() ->> 'tenant_id') = i.tenant_id::text
    )
  );

-- -----------------------------
-- -- PARTS & PART_USAGES & INVENTORY_TRANSACTIONS
-- -----------------------------
-- DROP POLICY IF EXISTS parts_select ON tenant.parts;
-- CREATE POLICY parts_select
--   ON tenant.parts
--   FOR SELECT
--   USING (
--     ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
--     OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','mechanic','frontdesk'))
--   );

-- DROP POLICY IF EXISTS parts_insert ON tenant.parts;
-- CREATE POLICY parts_insert
--   ON tenant.parts
--   FOR INSERT
--   WITH CHECK (
--     ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
--     OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin'))
--   );

-- DROP POLICY IF EXISTS part_usages_select ON tenant.part_usages;
-- CREATE POLICY part_usages_select
--   ON tenant.part_usages
--   FOR SELECT
--   USING (
--     ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
--     OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','mechanic'))
--   );

-- DROP POLICY IF EXISTS inventory_transactions_select ON tenant.inventory_transactions;
-- CREATE POLICY inventory_transactions_select
--   ON tenant.inventory_transactions
--   FOR SELECT
--   USING (
--     ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
--     OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin'))
--   );

-- -----------------------------
-- -- NOTIFICATIONS & ACTIVITIES (audit-ish)
-- -- Allow tenant staff to create notifications/activities; read restricted to tenant staff; delete limited to admin/service_role
-- -----------------------------
-- DROP POLICY IF EXISTS notifications_select ON tenant.notifications;
-- CREATE POLICY notifications_select
--   ON tenant.notifications
--   FOR SELECT
--   USING (
--     ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
--     OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk','mechanic'))
--   );

-- DROP POLICY IF EXISTS notifications_insert ON tenant.notifications;
-- CREATE POLICY notifications_insert
--   ON tenant.notifications
--   FOR INSERT
--   WITH CHECK (
--     ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
--     OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk'))
--   );

-- DROP POLICY IF EXISTS activities_select ON tenant.activities;
-- CREATE POLICY activities_select
--   ON tenant.activities
--   FOR SELECT
--   USING (
--     ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
--     OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant','admin'))
--   );

-- DROP POLICY IF EXISTS activities_insert ON tenant.activities;
-- CREATE POLICY activities_insert
--   ON tenant.activities
--   FOR INSERT
--   WITH CHECK (
--     ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
--     OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text)
--   );

-- -----------------------------
-- -- DVI (inspection) items & templates (similar tenant-scoped rules)
-- -----------------------------
-- DROP POLICY IF EXISTS dvi_items_select ON tenant.dvi_items;
-- CREATE POLICY dvi_items_select
--   ON tenant.dvi_items
--   FOR SELECT
--   USING (
--     ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
--     OR ((auth.jwt() ->> 'tenant_id') = (SELECT tenant_id::text FROM tenant.jobcards j WHERE j.id = dvi_items.jobcard_id) )
--   );

-- DROP POLICY IF EXISTS dvi_items_insert ON tenant.dvi_items;
-- CREATE POLICY dvi_items_insert
--   ON tenant.dvi_items
--   FOR INSERT
--   WITH CHECK (
--     ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'))
--     OR ((auth.jwt() ->> 'tenant_id') = (SELECT tenant_id::text FROM tenant.jobcards j WHERE j.id = dvi_items.jobcard_id) )
--   );

-----------------------------
-- Final Grants (subject to RLS)
-- Keep these broad grants; RLS policies determine actual access.
-----------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA tenant TO authenticated;
GRANT USAGE ON SCHEMA tenant TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA tenant TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;

-- Notes:
-- * If your JWT contains different claim names for tenant_id or role, replace auth.jwt() ->> 'tenant_id' and auth.jwt() ->> 'role' accordingly.
-- * Test policies carefully on a staging instance:
--   - Use a service token to confirm full access.
--   - Use a platform_admin user to confirm global admin access.
--   - Use a tenant/admin token with tenant_id claim to confirm tenant-scoped permissions.
-- * If a table has additional access requirements (for example, only mechanics may update certain fields), add narrower policies for those actions/columns.
>>>>>>> Stashed changes
