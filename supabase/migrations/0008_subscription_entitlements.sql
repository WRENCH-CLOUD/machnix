-- =============================================================================
-- 0008_subscription_entitlements.sql
-- Subscription Entitlement System: Validity dates, overrides ledger,
-- subscription invoices, and double-spend protection
-- =============================================================================

-- 1. Add subscription management columns to tenants
ALTER TABLE tenant.tenants
  ADD COLUMN IF NOT EXISTS subscription_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_end_at timestamptz,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS custom_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS billing_period text NOT NULL DEFAULT 'monthly';

-- 2. Subscription Overrides (Entitlement Ledger)
-- Tracks manual top-ups, extensions, and admin-granted overrides
CREATE TABLE IF NOT EXISTS tenant.subscription_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenant.tenants(id) ON DELETE CASCADE,
  feature_key text NOT NULL,          -- e.g., 'extra_jobs', 'extra_whatsapp', 'extend_expiry', or custom
  quantity integer NOT NULL DEFAULT 0,
  valid_from timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,             -- NULL = valid until billing cycle resets
  reason text,                        -- "Manual extension by Admin John"
  created_by text,                    -- Admin who created it
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Subscription Invoices (Internal billing audit trail)
-- Separate from tenant.invoices (which are customer-facing job invoices)
CREATE TABLE IF NOT EXISTS tenant.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenant.tenants(id) ON DELETE CASCADE,
  invoice_type text NOT NULL,         -- 'subscription', 'upgrade', 'topup', 'renewal'
  description text,
  amount numeric(12,2) NOT NULL,
  discount_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',  -- 'pending', 'paid', 'cancelled'
  payment_method text,                -- 'manual', 'razorpay', 'bank_transfer', etc.
  payment_reference text,             -- External payment ID (Razorpay order ID, etc.)
  metadata jsonb DEFAULT '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable Row-Level Security on new tables
ALTER TABLE tenant.subscription_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.subscription_invoices ENABLE ROW LEVEL SECURITY;

-- 5. Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_subscription_overrides_tenant
  ON tenant.subscription_overrides(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_overrides_active
  ON tenant.subscription_overrides(tenant_id, feature_key, expires_at);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_tenant
  ON tenant.subscription_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status
  ON tenant.subscription_invoices(tenant_id, status);

-- 6. Indexes for new tenant columns
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_end
  ON tenant.tenants(subscription_end_at);
CREATE INDEX IF NOT EXISTS idx_tenants_grace_period
  ON tenant.tenants(grace_period_ends_at);

-- 7. Double-spend protected job count check-and-increment
-- Uses SELECT ... FOR UPDATE to prevent race conditions
CREATE OR REPLACE FUNCTION tenant.check_and_increment_job_count(
  p_tenant_id uuid,
  p_tier_limit integer,
  p_override_extra integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_current integer;
  v_effective_limit integer;
  v_allowed boolean;
BEGIN
  -- Lock the tenant row and get current job count
  SELECT COALESCE((usage_counters->>'job_count')::integer, 0)
  INTO v_current
  FROM tenant.tenants
  WHERE id = p_tenant_id
  FOR UPDATE;

  v_effective_limit := p_tier_limit + p_override_extra;

  -- Check if limit would be exceeded (-1 = unlimited)
  IF p_tier_limit = -1 OR v_current < v_effective_limit THEN
    v_allowed := true;
    v_current := v_current + 1;

    UPDATE tenant.tenants
    SET usage_counters = jsonb_set(usage_counters, '{job_count}', to_jsonb(v_current))
    WHERE id = p_tenant_id;
  ELSE
    v_allowed := false;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'current', v_current,
    'limit', v_effective_limit
  );
END;
$$;

-- 8. Function to get active override total for a feature
CREATE OR REPLACE FUNCTION tenant.get_override_total(
  p_tenant_id uuid,
  p_feature_key text
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_total integer;
BEGIN
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_total
  FROM tenant.subscription_overrides
  WHERE tenant_id = p_tenant_id
    AND feature_key = p_feature_key
    AND valid_from <= now()
    AND (expires_at IS NULL OR expires_at > now());

  RETURN v_total;
END;
$$;

-- 9. Helper function to check if current user is a tenant admin
-- Securely validates admin role against the database instead of trusting JWT claims
-- Parameters:
--   p_tenant_id: The tenant ID to check admin access for
-- Returns:
--   boolean: true if the current user (auth.uid()) has an admin role in the tenant
-- Security:
--   Uses SECURITY DEFINER to allow RLS policies to query tenant.users table
--   Only checks active, non-deleted users with admin roles:
--   - tenant_owner: Full tenant ownership
--   - tenant_admin: Administrative access
--   - admin: Administrative access
CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM tenant.users
    WHERE auth_user_id = auth.uid()
      AND tenant_id = p_tenant_id
      AND role IN ('tenant_owner', 'tenant_admin', 'admin')
      AND is_active = true
      AND deleted_at IS NULL
  );
$$;

-- 10. Update admin_tenant_overview view with new subscription fields
DROP VIEW IF EXISTS tenant.admin_tenant_overview;
CREATE OR REPLACE VIEW tenant.admin_tenant_overview AS
SELECT
  t.id,
  t.name,
  t.status,
  t.subscription,
  t.subscription_status,
  t.subscription_start_at,
  t.subscription_end_at,
  t.grace_period_ends_at,
  t.trial_ends_at,
  t.custom_price,
  t.billing_period,
  t.billing_cycle_anchor,
  t.usage_counters,
  t.created_at,

  -- customers
  (
    SELECT count(*)
    FROM tenant.customers c
    WHERE c.tenant_id = t.id AND c.deleted_at IS NULL
  ) as customer_count,

  -- vehicles
  (
    SELECT count(*)
    FROM tenant.vehicles v
    WHERE v.tenant_id = t.id AND v.deleted_at IS NULL
  ) as vehicle_count,

  -- active jobs
  (
    SELECT count(*)
    FROM tenant.jobcards j
    WHERE j.tenant_id = t.id
      AND j.status IN ('pending', 'in_progress', 'on_hold', 'received')
      AND j.deleted_at IS NULL
  ) as active_jobs,

  -- completed jobs
  (
    SELECT count(*)
    FROM tenant.jobcards j
    WHERE j.tenant_id = t.id
      AND j.status = 'completed'
      AND j.deleted_at IS NULL
  ) as completed_jobs,

  -- total jobs (all time)
  (
    SELECT count(*)
    FROM tenant.jobcards j
    WHERE j.tenant_id = t.id AND j.deleted_at IS NULL
  ) as total_jobs,

  -- jobs this month (counts ALL created, not just active — prevents deletion gaming)
  (
    SELECT count(*)
    FROM tenant.jobcards j
    WHERE j.tenant_id = t.id
      AND j.created_at >= date_trunc('month', now())
  ) as jobs_this_month,

  -- mechanics/staff
  (
    SELECT count(*)
    FROM tenant.mechanics m
    WHERE m.tenant_id = t.id AND m.deleted_at IS NULL
  ) as mechanic_count,

  -- staff (users)
  (
    SELECT count(*)
    FROM tenant.users u
    WHERE u.tenant_id = t.id AND u.is_active = true AND u.deleted_at IS NULL
  ) as staff_count,

  -- revenue (total paid invoices)
  COALESCE(
    (
      SELECT sum(i.total_amount)
      FROM tenant.invoices i
      WHERE i.tenant_id = t.id
        AND i.status = 'paid'
        AND i.deleted_at IS NULL
    ),
    0
  ) as total_revenue,

  -- last job created date
  (
    SELECT max(j.created_at)
    FROM tenant.jobcards j
    WHERE j.tenant_id = t.id AND j.deleted_at IS NULL
  ) as last_job_date,

  -- has inventory usage (Pro feature)
  (
    SELECT count(*) > 0
    FROM tenant.parts p
    WHERE p.tenant_id = t.id AND p.deleted_at IS NULL
  ) as uses_inventory,

  -- WhatsApp messages this month
  (
    SELECT count(*)
    FROM tenant.notifications n
    WHERE n.tenant_id = t.id
      AND n.channel = 'whatsapp'
      AND n.created_at >= date_trunc('month', now())
  ) as whatsapp_this_month,

  -- Active override count
  (
    SELECT count(*)
    FROM tenant.subscription_overrides so
    WHERE so.tenant_id = t.id
      AND so.valid_from <= now()
      AND (so.expires_at IS NULL OR so.expires_at > now())
  ) as active_overrides_count

FROM tenant.tenants t
ORDER BY t.created_at DESC;

-- 11. RLS Policies for subscription_overrides
-- Only platform admins and tenant admins can manage subscription overrides

DROP POLICY IF EXISTS subscription_overrides_select ON tenant.subscription_overrides;
CREATE POLICY subscription_overrides_select ON tenant.subscription_overrides FOR SELECT
  USING (
    public.is_platform_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.is_tenant_admin(tenant_id)
    )
  );

DROP POLICY IF EXISTS subscription_overrides_insert ON tenant.subscription_overrides;
CREATE POLICY subscription_overrides_insert ON tenant.subscription_overrides FOR INSERT
  WITH CHECK (
    public.is_platform_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.is_tenant_admin(tenant_id)
    )
  );

DROP POLICY IF EXISTS subscription_overrides_update ON tenant.subscription_overrides;
CREATE POLICY subscription_overrides_update ON tenant.subscription_overrides FOR UPDATE
  USING (
    public.is_platform_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.is_tenant_admin(tenant_id)
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.is_tenant_admin(tenant_id)
    )
  );

DROP POLICY IF EXISTS subscription_overrides_delete ON tenant.subscription_overrides;
CREATE POLICY subscription_overrides_delete ON tenant.subscription_overrides FOR DELETE
  USING (
    public.is_platform_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.is_tenant_admin(tenant_id)
    )
  );

-- Service role bypass for subscription_overrides (needed for system operations)
DROP POLICY IF EXISTS subscription_overrides_service_role ON tenant.subscription_overrides;
CREATE POLICY subscription_overrides_service_role ON tenant.subscription_overrides FOR ALL
  USING (auth.role() = 'service_role');

-- 12. RLS Policies for subscription_invoices
-- Only platform admins and tenant admins can manage subscription invoices

DROP POLICY IF EXISTS subscription_invoices_select ON tenant.subscription_invoices;
CREATE POLICY subscription_invoices_select ON tenant.subscription_invoices FOR SELECT
  USING (
    public.is_platform_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.is_tenant_admin(tenant_id)
    )
  );

DROP POLICY IF EXISTS subscription_invoices_insert ON tenant.subscription_invoices;
CREATE POLICY subscription_invoices_insert ON tenant.subscription_invoices FOR INSERT
  WITH CHECK (
    public.is_platform_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.is_tenant_admin(tenant_id)
    )
  );

DROP POLICY IF EXISTS subscription_invoices_update ON tenant.subscription_invoices;
CREATE POLICY subscription_invoices_update ON tenant.subscription_invoices FOR UPDATE
  USING (
    public.is_platform_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.is_tenant_admin(tenant_id)
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.is_tenant_admin(tenant_id)
    )
  );

DROP POLICY IF EXISTS subscription_invoices_delete ON tenant.subscription_invoices;
CREATE POLICY subscription_invoices_delete ON tenant.subscription_invoices FOR DELETE
  USING (
    public.is_platform_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.is_tenant_admin(tenant_id)
    )
  );

-- Service role bypass for subscription_invoices (needed for system operations)
DROP POLICY IF EXISTS subscription_invoices_service_role ON tenant.subscription_invoices;
CREATE POLICY subscription_invoices_service_role ON tenant.subscription_invoices FOR ALL
  USING (auth.role() = 'service_role');

-- 13. Grant access to views and service role only
GRANT SELECT ON tenant.admin_tenant_overview TO authenticated;
GRANT SELECT ON tenant.admin_tenant_overview TO service_role;
GRANT ALL ON tenant.subscription_overrides TO service_role;
GRANT ALL ON tenant.subscription_invoices TO service_role;

-- End of 0008_subscription_entitlements.sql
