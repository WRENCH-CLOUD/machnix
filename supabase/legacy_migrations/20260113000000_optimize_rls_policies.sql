-- Optimize RLS Policies for Performance
-- Fix: Wrap auth.jwt() and auth.uid() calls in (SELECT ...) 
-- to prevent re-evaluation per row
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- =============================================================================
-- PLATFORM ADMINS
-- =============================================================================
DROP POLICY IF EXISTS platform_admins_all ON public.platform_admins;
CREATE POLICY platform_admins_all ON public.platform_admins FOR ALL
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR auth_user_id = (select auth.uid())
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR auth_user_id = (select auth.uid())
  );

-- =============================================================================
-- TENANT.TENANTS
-- =============================================================================
DROP POLICY IF EXISTS tenants_select ON tenant.tenants;
CREATE POLICY tenants_select ON tenant.tenants FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = id::text
  );

DROP POLICY IF EXISTS tenants_insert ON tenant.tenants;
CREATE POLICY tenants_insert ON tenant.tenants FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
  );

DROP POLICY IF EXISTS tenants_update ON tenant.tenants;
CREATE POLICY tenants_update ON tenant.tenants FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = id::text
  );

-- =============================================================================
-- TENANT.USERS
-- =============================================================================
DROP POLICY IF EXISTS users_select ON tenant.users;
CREATE POLICY users_select ON tenant.users FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
    OR auth_user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS users_insert ON tenant.users;
CREATE POLICY users_insert ON tenant.users FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS users_update ON tenant.users;
CREATE POLICY users_update ON tenant.users FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
    OR auth_user_id = (select auth.uid())
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS users_delete ON tenant.users;
CREATE POLICY users_delete ON tenant.users FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- =============================================================================
-- Helper macro for standard tenant isolation
-- Pattern: service_role/platform_admin bypass, or tenant_id match with role check
-- =============================================================================

-- CUSTOMERS
DROP POLICY IF EXISTS customers_select ON tenant.customers;
CREATE POLICY customers_select ON tenant.customers FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
      )
    )
  );

DROP POLICY IF EXISTS customers_insert ON tenant.customers;
CREATE POLICY customers_insert ON tenant.customers FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS customers_update ON tenant.customers;
CREATE POLICY customers_update ON tenant.customers FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS customers_delete ON tenant.customers;
CREATE POLICY customers_delete ON tenant.customers FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin')
      )
    )
  );

-- VEHICLES
DROP POLICY IF EXISTS vehicles_select ON tenant.vehicles;
CREATE POLICY vehicles_select ON tenant.vehicles FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
      )
    )
  );

DROP POLICY IF EXISTS vehicles_insert ON tenant.vehicles;
CREATE POLICY vehicles_insert ON tenant.vehicles FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS vehicles_update ON tenant.vehicles;
CREATE POLICY vehicles_update ON tenant.vehicles FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS vehicles_delete ON tenant.vehicles;
CREATE POLICY vehicles_delete ON tenant.vehicles FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin')
      )
    )
  );

-- JOBCARDS
DROP POLICY IF EXISTS jobcards_select ON tenant.jobcards;
CREATE POLICY jobcards_select ON tenant.jobcards FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
      )
    )
  );

DROP POLICY IF EXISTS jobcards_insert ON tenant.jobcards;
CREATE POLICY jobcards_insert ON tenant.jobcards FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS jobcards_update ON tenant.jobcards;
CREATE POLICY jobcards_update ON tenant.jobcards FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
      )
    )
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
      )
    )
  );

DROP POLICY IF EXISTS jobcards_delete ON tenant.jobcards;
CREATE POLICY jobcards_delete ON tenant.jobcards FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin')
      )
    )
  );

-- ESTIMATES
DROP POLICY IF EXISTS estimates_select ON tenant.estimates;
CREATE POLICY estimates_select ON tenant.estimates FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
      )
    )
  );

DROP POLICY IF EXISTS estimates_insert ON tenant.estimates;
CREATE POLICY estimates_insert ON tenant.estimates FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS estimates_update ON tenant.estimates;
CREATE POLICY estimates_update ON tenant.estimates FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS estimates_delete ON tenant.estimates;
CREATE POLICY estimates_delete ON tenant.estimates FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin')
      )
    )
  );

-- INVOICES
DROP POLICY IF EXISTS invoices_select ON tenant.invoices;
CREATE POLICY invoices_select ON tenant.invoices FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk','mechanic')
      )
    )
  );

DROP POLICY IF EXISTS invoices_insert ON tenant.invoices;
CREATE POLICY invoices_insert ON tenant.invoices FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS invoices_update ON tenant.invoices;
CREATE POLICY invoices_update ON tenant.invoices FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS invoices_delete ON tenant.invoices;
CREATE POLICY invoices_delete ON tenant.invoices FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin')
      )
    )
  );

-- PAYMENTS
DROP POLICY IF EXISTS payments_select ON tenant.payments;
CREATE POLICY payments_select ON tenant.payments FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS payments_insert ON tenant.payments;
CREATE POLICY payments_insert ON tenant.payments FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS payments_update ON tenant.payments;
CREATE POLICY payments_update ON tenant.payments FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS payments_delete ON tenant.payments;
CREATE POLICY payments_delete ON tenant.payments FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin')
      )
    )
  );

-- PAYMENT_TRANSACTIONS
DROP POLICY IF EXISTS payment_transactions_select ON tenant.payment_transactions;
CREATE POLICY payment_transactions_select ON tenant.payment_transactions FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS payment_transactions_insert ON tenant.payment_transactions;
CREATE POLICY payment_transactions_insert ON tenant.payment_transactions FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS payment_transactions_update ON tenant.payment_transactions;
CREATE POLICY payment_transactions_update ON tenant.payment_transactions FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin','frontdesk')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

DROP POLICY IF EXISTS payment_transactions_delete ON tenant.payment_transactions;
CREATE POLICY payment_transactions_delete ON tenant.payment_transactions FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin')
      )
    )
  );

-- MECHANICS
DROP POLICY IF EXISTS mechanics_select ON tenant.mechanics;
CREATE POLICY mechanics_select ON tenant.mechanics FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS mechanics_insert ON tenant.mechanics;
CREATE POLICY mechanics_insert ON tenant.mechanics FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin')
      )
    )
  );

DROP POLICY IF EXISTS mechanics_update ON tenant.mechanics;
CREATE POLICY mechanics_update ON tenant.mechanics FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin')
      )
    )
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin')
      )
    )
  );

DROP POLICY IF EXISTS mechanics_delete ON tenant.mechanics;
CREATE POLICY mechanics_delete ON tenant.mechanics FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (
      ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
      AND (
        ((select auth.jwt()) ->> 'role') IN ('tenant','admin')
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('tenant','admin')
      )
    )
  );

-- PARTS
DROP POLICY IF EXISTS parts_select ON tenant.parts;
CREATE POLICY parts_select ON tenant.parts FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS parts_insert ON tenant.parts;
CREATE POLICY parts_insert ON tenant.parts FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS parts_update ON tenant.parts;
CREATE POLICY parts_update ON tenant.parts FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS parts_delete ON tenant.parts;
CREATE POLICY parts_delete ON tenant.parts FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- PART_USAGES
DROP POLICY IF EXISTS part_usages_select ON tenant.part_usages;
CREATE POLICY part_usages_select ON tenant.part_usages FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS part_usages_insert ON tenant.part_usages;
CREATE POLICY part_usages_insert ON tenant.part_usages FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS part_usages_update ON tenant.part_usages;
CREATE POLICY part_usages_update ON tenant.part_usages FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS part_usages_delete ON tenant.part_usages;
CREATE POLICY part_usages_delete ON tenant.part_usages FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- INVENTORY_TRANSACTIONS
DROP POLICY IF EXISTS inventory_transactions_select ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_select ON tenant.inventory_transactions FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS inventory_transactions_insert ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_insert ON tenant.inventory_transactions FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS inventory_transactions_update ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_update ON tenant.inventory_transactions FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS inventory_transactions_delete ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_delete ON tenant.inventory_transactions FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- NOTIFICATIONS
DROP POLICY IF EXISTS notifications_select ON tenant.notifications;
CREATE POLICY notifications_select ON tenant.notifications FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS notifications_insert ON tenant.notifications;
CREATE POLICY notifications_insert ON tenant.notifications FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS notifications_update ON tenant.notifications;
CREATE POLICY notifications_update ON tenant.notifications FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS notifications_delete ON tenant.notifications;
CREATE POLICY notifications_delete ON tenant.notifications FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- ACTIVITIES
DROP POLICY IF EXISTS activities_select ON tenant.activities;
CREATE POLICY activities_select ON tenant.activities FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS activities_insert ON tenant.activities;
CREATE POLICY activities_insert ON tenant.activities FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS activities_update ON tenant.activities;
CREATE POLICY activities_update ON tenant.activities FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS activities_delete ON tenant.activities;
CREATE POLICY activities_delete ON tenant.activities FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- DVI_ITEMS (no tenant_id, uses jobcard_id - derive from jobcards)
DROP POLICY IF EXISTS dvi_items_select ON tenant.dvi_items;
CREATE POLICY dvi_items_select ON tenant.dvi_items FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j 
      WHERE j.id = jobcard_id 
      AND ((select auth.jwt()) ->> 'tenant_id') = j.tenant_id::text
    )
  );

DROP POLICY IF EXISTS dvi_items_insert ON tenant.dvi_items;
CREATE POLICY dvi_items_insert ON tenant.dvi_items FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j 
      WHERE j.id = jobcard_id 
      AND ((select auth.jwt()) ->> 'tenant_id') = j.tenant_id::text
    )
  );

DROP POLICY IF EXISTS dvi_items_update ON tenant.dvi_items;
CREATE POLICY dvi_items_update ON tenant.dvi_items FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j 
      WHERE j.id = jobcard_id 
      AND ((select auth.jwt()) ->> 'tenant_id') = j.tenant_id::text
    )
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j 
      WHERE j.id = jobcard_id 
      AND ((select auth.jwt()) ->> 'tenant_id') = j.tenant_id::text
    )
  );

DROP POLICY IF EXISTS dvi_items_delete ON tenant.dvi_items;
CREATE POLICY dvi_items_delete ON tenant.dvi_items FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j 
      WHERE j.id = jobcard_id 
      AND ((select auth.jwt()) ->> 'tenant_id') = j.tenant_id::text
    )
  );

-- DVI_TEMPLATES
DROP POLICY IF EXISTS dvi_templates_select ON tenant.dvi_templates;
CREATE POLICY dvi_templates_select ON tenant.dvi_templates FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS dvi_templates_insert ON tenant.dvi_templates;
CREATE POLICY dvi_templates_insert ON tenant.dvi_templates FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS dvi_templates_update ON tenant.dvi_templates;
CREATE POLICY dvi_templates_update ON tenant.dvi_templates FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS dvi_templates_delete ON tenant.dvi_templates;
CREATE POLICY dvi_templates_delete ON tenant.dvi_templates FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- DVI_CHECKPOINTS
DROP POLICY IF EXISTS dvi_checkpoints_select ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_select ON tenant.dvi_checkpoints FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS dvi_checkpoints_insert ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_insert ON tenant.dvi_checkpoints FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS dvi_checkpoints_update ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_update ON tenant.dvi_checkpoints FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS dvi_checkpoints_delete ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_delete ON tenant.dvi_checkpoints FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- DVI_CHECKPOINT_CATEGORIES
DROP POLICY IF EXISTS dvi_checkpoint_categories_select ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_select ON tenant.dvi_checkpoint_categories FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS dvi_checkpoint_categories_insert ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_insert ON tenant.dvi_checkpoint_categories FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS dvi_checkpoint_categories_update ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_update ON tenant.dvi_checkpoint_categories FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS dvi_checkpoint_categories_delete ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_delete ON tenant.dvi_checkpoint_categories FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- SETTINGS
DROP POLICY IF EXISTS settings_select ON tenant.settings;
CREATE POLICY settings_select ON tenant.settings FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS settings_insert ON tenant.settings;
CREATE POLICY settings_insert ON tenant.settings FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS settings_update ON tenant.settings;
CREATE POLICY settings_update ON tenant.settings FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS settings_delete ON tenant.settings;
CREATE POLICY settings_delete ON tenant.settings FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- RAZORPAY_SETTINGS
DROP POLICY IF EXISTS razorpay_settings_select ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_select ON tenant.razorpay_settings FOR SELECT
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS razorpay_settings_insert ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_insert ON tenant.razorpay_settings FOR INSERT
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS razorpay_settings_update ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_update ON tenant.razorpay_settings FOR UPDATE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS razorpay_settings_delete ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_delete ON tenant.razorpay_settings FOR DELETE
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- COUNTERS
DROP POLICY IF EXISTS counters_access ON tenant.counters;
CREATE POLICY counters_access ON tenant.counters FOR ALL
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );

-- MONTHLY_ANALYTICS (single policy for all operations)
DROP POLICY IF EXISTS monthly_analytics_read ON tenant.monthly_analytics;
DROP POLICY IF EXISTS monthly_analytics_write ON tenant.monthly_analytics;
CREATE POLICY monthly_analytics_access ON tenant.monthly_analytics FOR ALL
  USING (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    ((select auth.jwt()) ->> 'role') IN ('service_role','platform_admin')
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR ((select auth.jwt()) ->> 'tenant_id') = tenant_id::text
  );
