-- =============================================================================
-- 0002_auth_and_security.sql
-- All access control: Enable RLS, Helper Functions, Policies, Grants
-- NO table creation, NO enums, NO views
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTIONS (Security Only)
-- =============================================================================

-- current_tenant_id() - Extract tenant_id from JWT
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::uuid,
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );
$$;

-- current_user_role() - Extract role from JWT
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  );
$$;

-- is_platform_admin() - Check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (
    public.current_user_role() IN ('service_role', 'platform_admin')
  );
$$;

-- is_tenant_member() - Check if user belongs to a specific tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_tenant_id() = p_tenant_id;
$$;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

-- Public schema
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Tenant schema
ALTER TABLE tenant.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.jobcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.part_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.dvi_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.dvi_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.dvi_checkpoint_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.dvi_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.dvi_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.razorpay_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.monthly_analytics ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Schema access
GRANT USAGE ON SCHEMA tenant TO authenticated;
GRANT USAGE ON SCHEMA tenant TO service_role;

-- Table access for authenticated users (RLS will filter)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA tenant TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant TO service_role;

-- Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant GRANT ALL PRIVILEGES ON TABLES TO service_role;

-- Leads table grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- =============================================================================
-- RLS POLICIES: PUBLIC.PLATFORM_ADMINS
-- =============================================================================

DROP POLICY IF EXISTS platform_admins_all ON public.platform_admins;
CREATE POLICY platform_admins_all ON public.platform_admins FOR ALL
  USING (
    public.is_platform_admin()
    OR auth_user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    public.is_platform_admin()
    OR auth_user_id = (SELECT auth.uid())
  );

-- =============================================================================
-- RLS POLICIES: PUBLIC.LEADS (Platform Admin Only)
-- =============================================================================

DROP POLICY IF EXISTS "Platform admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Platform admins can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Platform admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Platform admins can delete leads" ON public.leads;

CREATE POLICY leads_select ON public.leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY leads_insert ON public.leads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY leads_update ON public.leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY leads_delete ON public.leads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = (SELECT auth.uid())
    )
  );

-- =============================================================================
-- RLS POLICIES: TENANT.TENANTS
-- =============================================================================

DROP POLICY IF EXISTS tenants_select ON tenant.tenants;
CREATE POLICY tenants_select ON tenant.tenants FOR SELECT
  USING (
    public.is_platform_admin()
    OR id = public.current_tenant_id()
  );

DROP POLICY IF EXISTS tenants_insert ON tenant.tenants;
CREATE POLICY tenants_insert ON tenant.tenants FOR INSERT
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS tenants_update ON tenant.tenants;
CREATE POLICY tenants_update ON tenant.tenants FOR UPDATE
  USING (
    public.is_platform_admin()
    OR id = public.current_tenant_id()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR id = public.current_tenant_id()
  );

-- =============================================================================
-- RLS POLICIES: TENANT.USERS
-- =============================================================================

DROP POLICY IF EXISTS users_select ON tenant.users;
CREATE POLICY users_select ON tenant.users FOR SELECT
  USING (
    public.is_platform_admin()
    OR tenant_id = public.current_tenant_id()
    OR auth_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS users_insert ON tenant.users;
CREATE POLICY users_insert ON tenant.users FOR INSERT
  WITH CHECK (
    public.is_platform_admin()
    OR tenant_id = public.current_tenant_id()
  );

DROP POLICY IF EXISTS users_update ON tenant.users;
CREATE POLICY users_update ON tenant.users FOR UPDATE
  USING (
    public.is_platform_admin()
    OR tenant_id = public.current_tenant_id()
    OR auth_user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    public.is_platform_admin()
    OR tenant_id = public.current_tenant_id()
  );

DROP POLICY IF EXISTS users_delete ON tenant.users;
CREATE POLICY users_delete ON tenant.users FOR DELETE
  USING (
    public.is_platform_admin()
    OR tenant_id = public.current_tenant_id()
  );

-- =============================================================================
-- RLS POLICIES: STANDARD TENANT TABLES (tenant_id isolation)
-- Pattern: platform_admin bypass OR tenant_id match
-- =============================================================================

-- CUSTOMERS
DROP POLICY IF EXISTS customers_select ON tenant.customers;
CREATE POLICY customers_select ON tenant.customers FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS customers_insert ON tenant.customers;
CREATE POLICY customers_insert ON tenant.customers FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS customers_update ON tenant.customers;
CREATE POLICY customers_update ON tenant.customers FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS customers_delete ON tenant.customers;
CREATE POLICY customers_delete ON tenant.customers FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- VEHICLES
DROP POLICY IF EXISTS vehicles_select ON tenant.vehicles;
CREATE POLICY vehicles_select ON tenant.vehicles FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS vehicles_insert ON tenant.vehicles;
CREATE POLICY vehicles_insert ON tenant.vehicles FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS vehicles_update ON tenant.vehicles;
CREATE POLICY vehicles_update ON tenant.vehicles FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS vehicles_delete ON tenant.vehicles;
CREATE POLICY vehicles_delete ON tenant.vehicles FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- MECHANICS
DROP POLICY IF EXISTS mechanics_select ON tenant.mechanics;
CREATE POLICY mechanics_select ON tenant.mechanics FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS mechanics_insert ON tenant.mechanics;
CREATE POLICY mechanics_insert ON tenant.mechanics FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS mechanics_update ON tenant.mechanics;
CREATE POLICY mechanics_update ON tenant.mechanics FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS mechanics_delete ON tenant.mechanics;
CREATE POLICY mechanics_delete ON tenant.mechanics FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- JOBCARDS
DROP POLICY IF EXISTS jobcards_select ON tenant.jobcards;
CREATE POLICY jobcards_select ON tenant.jobcards FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS jobcards_insert ON tenant.jobcards;
CREATE POLICY jobcards_insert ON tenant.jobcards FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS jobcards_update ON tenant.jobcards;
CREATE POLICY jobcards_update ON tenant.jobcards FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS jobcards_delete ON tenant.jobcards;
CREATE POLICY jobcards_delete ON tenant.jobcards FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- PARTS
DROP POLICY IF EXISTS parts_select ON tenant.parts;
CREATE POLICY parts_select ON tenant.parts FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS parts_insert ON tenant.parts;
CREATE POLICY parts_insert ON tenant.parts FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS parts_update ON tenant.parts;
CREATE POLICY parts_update ON tenant.parts FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS parts_delete ON tenant.parts;
CREATE POLICY parts_delete ON tenant.parts FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- PART_USAGES
DROP POLICY IF EXISTS part_usages_select ON tenant.part_usages;
CREATE POLICY part_usages_select ON tenant.part_usages FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS part_usages_insert ON tenant.part_usages;
CREATE POLICY part_usages_insert ON tenant.part_usages FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS part_usages_update ON tenant.part_usages;
CREATE POLICY part_usages_update ON tenant.part_usages FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS part_usages_delete ON tenant.part_usages;
CREATE POLICY part_usages_delete ON tenant.part_usages FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- ESTIMATES
DROP POLICY IF EXISTS estimates_select ON tenant.estimates;
CREATE POLICY estimates_select ON tenant.estimates FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS estimates_insert ON tenant.estimates;
CREATE POLICY estimates_insert ON tenant.estimates FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS estimates_update ON tenant.estimates;
CREATE POLICY estimates_update ON tenant.estimates FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS estimates_delete ON tenant.estimates;
CREATE POLICY estimates_delete ON tenant.estimates FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- ESTIMATE_ITEMS (has tenant_id, use direct tenant isolation)
DROP POLICY IF EXISTS estimate_items_select ON tenant.estimate_items;
CREATE POLICY estimate_items_select ON tenant.estimate_items FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS estimate_items_insert ON tenant.estimate_items;
CREATE POLICY estimate_items_insert ON tenant.estimate_items FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS estimate_items_update ON tenant.estimate_items;
CREATE POLICY estimate_items_update ON tenant.estimate_items FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS estimate_items_delete ON tenant.estimate_items;
CREATE POLICY estimate_items_delete ON tenant.estimate_items FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- INVOICES
DROP POLICY IF EXISTS invoices_select ON tenant.invoices;
CREATE POLICY invoices_select ON tenant.invoices FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS invoices_insert ON tenant.invoices;
CREATE POLICY invoices_insert ON tenant.invoices FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS invoices_update ON tenant.invoices;
CREATE POLICY invoices_update ON tenant.invoices FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS invoices_delete ON tenant.invoices;
CREATE POLICY invoices_delete ON tenant.invoices FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- PAYMENTS
DROP POLICY IF EXISTS payments_select ON tenant.payments;
CREATE POLICY payments_select ON tenant.payments FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS payments_insert ON tenant.payments;
CREATE POLICY payments_insert ON tenant.payments FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS payments_update ON tenant.payments;
CREATE POLICY payments_update ON tenant.payments FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS payments_delete ON tenant.payments;
CREATE POLICY payments_delete ON tenant.payments FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- PAYMENT_TRANSACTIONS
DROP POLICY IF EXISTS payment_transactions_select ON tenant.payment_transactions;
CREATE POLICY payment_transactions_select ON tenant.payment_transactions FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS payment_transactions_insert ON tenant.payment_transactions;
CREATE POLICY payment_transactions_insert ON tenant.payment_transactions FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS payment_transactions_update ON tenant.payment_transactions;
CREATE POLICY payment_transactions_update ON tenant.payment_transactions FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS payment_transactions_delete ON tenant.payment_transactions;
CREATE POLICY payment_transactions_delete ON tenant.payment_transactions FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- INVENTORY_TRANSACTIONS
DROP POLICY IF EXISTS inventory_transactions_select ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_select ON tenant.inventory_transactions FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS inventory_transactions_insert ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_insert ON tenant.inventory_transactions FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS inventory_transactions_update ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_update ON tenant.inventory_transactions FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS inventory_transactions_delete ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_delete ON tenant.inventory_transactions FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- NOTIFICATIONS
DROP POLICY IF EXISTS notifications_select ON tenant.notifications;
CREATE POLICY notifications_select ON tenant.notifications FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS notifications_insert ON tenant.notifications;
CREATE POLICY notifications_insert ON tenant.notifications FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS notifications_update ON tenant.notifications;
CREATE POLICY notifications_update ON tenant.notifications FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS notifications_delete ON tenant.notifications;
CREATE POLICY notifications_delete ON tenant.notifications FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- ACTIVITIES
DROP POLICY IF EXISTS activities_select ON tenant.activities;
CREATE POLICY activities_select ON tenant.activities FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS activities_insert ON tenant.activities;
CREATE POLICY activities_insert ON tenant.activities FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS activities_update ON tenant.activities;
CREATE POLICY activities_update ON tenant.activities FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS activities_delete ON tenant.activities;
CREATE POLICY activities_delete ON tenant.activities FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- DVI_TEMPLATES
DROP POLICY IF EXISTS dvi_templates_select ON tenant.dvi_templates;
CREATE POLICY dvi_templates_select ON tenant.dvi_templates FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS dvi_templates_insert ON tenant.dvi_templates;
CREATE POLICY dvi_templates_insert ON tenant.dvi_templates FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS dvi_templates_update ON tenant.dvi_templates;
CREATE POLICY dvi_templates_update ON tenant.dvi_templates FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS dvi_templates_delete ON tenant.dvi_templates;
CREATE POLICY dvi_templates_delete ON tenant.dvi_templates FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- DVI_CHECKPOINTS
DROP POLICY IF EXISTS dvi_checkpoints_select ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_select ON tenant.dvi_checkpoints FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS dvi_checkpoints_insert ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_insert ON tenant.dvi_checkpoints FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS dvi_checkpoints_update ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_update ON tenant.dvi_checkpoints FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS dvi_checkpoints_delete ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_delete ON tenant.dvi_checkpoints FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- DVI_CHECKPOINT_CATEGORIES
DROP POLICY IF EXISTS dvi_checkpoint_categories_select ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_select ON tenant.dvi_checkpoint_categories FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS dvi_checkpoint_categories_insert ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_insert ON tenant.dvi_checkpoint_categories FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS dvi_checkpoint_categories_update ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_update ON tenant.dvi_checkpoint_categories FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS dvi_checkpoint_categories_delete ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_delete ON tenant.dvi_checkpoint_categories FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- DVI_ITEMS (no tenant_id, use jobcard_id join)
DROP POLICY IF EXISTS dvi_items_select ON tenant.dvi_items;
CREATE POLICY dvi_items_select ON tenant.dvi_items FOR SELECT
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j
      WHERE j.id = jobcard_id
      AND j.tenant_id = public.current_tenant_id()
    )
  );

DROP POLICY IF EXISTS dvi_items_insert ON tenant.dvi_items;
CREATE POLICY dvi_items_insert ON tenant.dvi_items FOR INSERT
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j
      WHERE j.id = jobcard_id
      AND j.tenant_id = public.current_tenant_id()
    )
  );

DROP POLICY IF EXISTS dvi_items_update ON tenant.dvi_items;
CREATE POLICY dvi_items_update ON tenant.dvi_items FOR UPDATE
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j
      WHERE j.id = jobcard_id
      AND j.tenant_id = public.current_tenant_id()
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j
      WHERE j.id = jobcard_id
      AND j.tenant_id = public.current_tenant_id()
    )
  );

DROP POLICY IF EXISTS dvi_items_delete ON tenant.dvi_items;
CREATE POLICY dvi_items_delete ON tenant.dvi_items FOR DELETE
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j
      WHERE j.id = jobcard_id
      AND j.tenant_id = public.current_tenant_id()
    )
  );

-- DVI_PHOTOS (no tenant_id, join through dvi_items -> jobcards)
DROP POLICY IF EXISTS dvi_photos_select ON tenant.dvi_photos;
CREATE POLICY dvi_photos_select ON tenant.dvi_photos FOR SELECT
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM tenant.dvi_items di
      JOIN tenant.jobcards j ON j.id = di.jobcard_id
      WHERE di.id = dvi_item_id
      AND j.tenant_id = public.current_tenant_id()
    )
  );

DROP POLICY IF EXISTS dvi_photos_insert ON tenant.dvi_photos;
CREATE POLICY dvi_photos_insert ON tenant.dvi_photos FOR INSERT
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM tenant.dvi_items di
      JOIN tenant.jobcards j ON j.id = di.jobcard_id
      WHERE di.id = dvi_item_id
      AND j.tenant_id = public.current_tenant_id()
    )
  );

DROP POLICY IF EXISTS dvi_photos_update ON tenant.dvi_photos;
CREATE POLICY dvi_photos_update ON tenant.dvi_photos FOR UPDATE
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM tenant.dvi_items di
      JOIN tenant.jobcards j ON j.id = di.jobcard_id
      WHERE di.id = dvi_item_id
      AND j.tenant_id = public.current_tenant_id()
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM tenant.dvi_items di
      JOIN tenant.jobcards j ON j.id = di.jobcard_id
      WHERE di.id = dvi_item_id
      AND j.tenant_id = public.current_tenant_id()
    )
  );

DROP POLICY IF EXISTS dvi_photos_delete ON tenant.dvi_photos;
CREATE POLICY dvi_photos_delete ON tenant.dvi_photos FOR DELETE
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM tenant.dvi_items di
      JOIN tenant.jobcards j ON j.id = di.jobcard_id
      WHERE di.id = dvi_item_id
      AND j.tenant_id = public.current_tenant_id()
    )
  );

-- SETTINGS
DROP POLICY IF EXISTS settings_select ON tenant.settings;
CREATE POLICY settings_select ON tenant.settings FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS settings_insert ON tenant.settings;
CREATE POLICY settings_insert ON tenant.settings FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS settings_update ON tenant.settings;
CREATE POLICY settings_update ON tenant.settings FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS settings_delete ON tenant.settings;
CREATE POLICY settings_delete ON tenant.settings FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- RAZORPAY_SETTINGS
DROP POLICY IF EXISTS razorpay_settings_select ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_select ON tenant.razorpay_settings FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS razorpay_settings_insert ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_insert ON tenant.razorpay_settings FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS razorpay_settings_update ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_update ON tenant.razorpay_settings FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS razorpay_settings_delete ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_delete ON tenant.razorpay_settings FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- COUNTERS
DROP POLICY IF EXISTS counters_access ON tenant.counters;
CREATE POLICY counters_access ON tenant.counters FOR ALL
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- MONTHLY_ANALYTICS
DROP POLICY IF EXISTS monthly_analytics_read ON tenant.monthly_analytics;
DROP POLICY IF EXISTS monthly_analytics_write ON tenant.monthly_analytics;
DROP POLICY IF EXISTS monthly_analytics_access ON tenant.monthly_analytics;
CREATE POLICY monthly_analytics_access ON tenant.monthly_analytics FOR ALL
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- End of 0002_auth_and_security.sql
