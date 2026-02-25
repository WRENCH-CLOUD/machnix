-- =============================================================================
-- 0007_subscription_gating.sql
-- Subscription & Feature Gating: Schema changes for multi-tier subscriptions
-- =============================================================================

-- 1. Add subscription management columns to tenants
-- (subscription_status already exists as text in base schema)
ALTER TABLE tenant.tenants
  ADD COLUMN IF NOT EXISTS billing_cycle_anchor timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS usage_counters jsonb NOT NULL DEFAULT '{"job_count": 0, "staff_count": 0, "whatsapp_count": 0}'::jsonb;

-- 2. Add whatsapp and staff tracking to monthly_analytics  
ALTER TABLE tenant.monthly_analytics
  ADD COLUMN IF NOT EXISTS total_staff integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_messages_sent integer NOT NULL DEFAULT 0;

-- 3. Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_tenants_subscription ON tenant.tenants(subscription);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenant.tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_billing_anchor ON tenant.tenants(billing_cycle_anchor);

-- 4. Update admin_tenant_overview view to include subscription details + usage
DROP VIEW IF EXISTS tenant.admin_tenant_overview;
CREATE OR REPLACE VIEW tenant.admin_tenant_overview AS
SELECT
  t.id,
  t.name,
  t.status,
  t.subscription,
  t.subscription_status,
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

  -- jobs this month
  (
    SELECT count(*)
    FROM tenant.jobcards j
    WHERE j.tenant_id = t.id
      AND j.deleted_at IS NULL
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
  ) as uses_inventory

FROM tenant.tenants t
ORDER BY t.created_at DESC;

-- 5. Grant access to the updated view
GRANT SELECT ON tenant.admin_tenant_overview TO authenticated;
GRANT SELECT ON tenant.admin_tenant_overview TO service_role;

-- 6. Function to reset monthly usage counters
CREATE OR REPLACE FUNCTION tenant.reset_monthly_usage_counters()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tenant.tenants
  SET usage_counters = jsonb_set(
    jsonb_set(usage_counters, '{job_count}', '0'::jsonb),
    '{whatsapp_count}', '0'::jsonb
  ),
  billing_cycle_anchor = now()
  WHERE billing_cycle_anchor < (now() - interval '1 month');
END;
$$;

-- 7. Function to increment job count for a tenant
CREATE OR REPLACE FUNCTION tenant.increment_job_count(p_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_current integer;
BEGIN
  SELECT COALESCE((usage_counters->>'job_count')::integer, 0)
  INTO v_current
  FROM tenant.tenants
  WHERE id = p_tenant_id
  FOR UPDATE;

  v_current := v_current + 1;

  UPDATE tenant.tenants
  SET usage_counters = jsonb_set(usage_counters, '{job_count}', to_jsonb(v_current))
  WHERE id = p_tenant_id;

  RETURN v_current;
END;
$$;

-- 8. Function to get current month job count (from actual data)
CREATE OR REPLACE FUNCTION tenant.get_current_month_job_count(p_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*)
  INTO v_count
  FROM tenant.jobcards
  WHERE tenant_id = p_tenant_id
    AND deleted_at IS NULL
    AND created_at >= date_trunc('month', now());

  RETURN v_count;
END;
$$;

-- End of 0007_subscription_gating.sql
