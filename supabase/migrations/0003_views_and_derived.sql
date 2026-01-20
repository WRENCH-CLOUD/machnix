-- =============================================================================
-- 0003_views_and_derived.sql
-- Read-only: Views, Materialized Views, Analytics, Helper Functions
-- Safe to drop and recreate at any time
-- NO RLS, NO Policies, NO auth.jwt(), NO Grants, NO Writes
-- =============================================================================

-- =============================================================================
-- READ-ONLY HELPER FUNCTIONS (for counters/analytics)
-- =============================================================================

-- get_next_counter_value - Atomically increments and returns formatted value
-- Example return: INV-00001
CREATE OR REPLACE FUNCTION tenant.get_next_counter_value(
  p_tenant_id uuid,
  p_counter_key text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix text;
  v_next_value integer;
BEGIN
  -- Lock the counter row for this tenant + counter
  SELECT prefix, current_value
  INTO v_prefix, v_next_value
  FROM tenant.counters
  WHERE tenant_id = p_tenant_id
    AND counter_key = p_counter_key
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Counter "%" not initialized for tenant %', p_counter_key, p_tenant_id;
  END IF;

  -- Increment
  v_next_value := v_next_value + 1;

  UPDATE tenant.counters
  SET current_value = v_next_value,
      updated_at = now()
  WHERE tenant_id = p_tenant_id
    AND counter_key = p_counter_key;

  -- Format: PREFIX-00001
  RETURN v_prefix || '-' || LPAD(v_next_value::text, 5, '0');
END;
$$;

-- init_default_counters - Initialize standard counters for a new tenant
CREATE OR REPLACE FUNCTION tenant.init_default_counters(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO tenant.counters (tenant_id, counter_key, prefix)
  VALUES
    (p_tenant_id, 'invoice',  'INV'),
    (p_tenant_id, 'jobcard',  'JOB'),
    (p_tenant_id, 'estimate', 'EST')
  ON CONFLICT (tenant_id, counter_key) DO NOTHING;
END;
$$;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- tenant_stats_view - Per-tenant stats (respects RLS via security_invoker)
CREATE OR REPLACE VIEW tenant.tenant_stats_view WITH (security_invoker = true) AS
SELECT
    t.id,
    t.name,
    t.slug,
    t.created_at,
    t.metadata,
    (SELECT count(*) FROM tenant.customers c WHERE c.tenant_id = t.id) as customer_count,
    (SELECT count(*) FROM tenant.jobcards j WHERE j.tenant_id = t.id AND j.status IN ('pending', 'in_progress', 'on_hold')) as active_jobs,
    (SELECT count(*) FROM tenant.jobcards j WHERE j.tenant_id = t.id AND j.status = 'completed') as completed_jobs,
    (SELECT count(*) FROM tenant.mechanics m WHERE m.tenant_id = t.id) as mechanic_count,
    COALESCE((SELECT sum(total_amount) FROM tenant.invoices i WHERE i.tenant_id = t.id AND i.status = 'paid'), 0) as total_revenue
FROM tenant.tenants t;

-- admin_tenant_overview - Admin view for tenant overview (platform admins)
CREATE OR REPLACE VIEW tenant.admin_tenant_overview AS
SELECT
  t.id,
  t.name,
  t.status,
  t.created_at,
  
  -- customers
  (
    SELECT count(*)
    FROM tenant.customers c
    WHERE c.tenant_id = t.id
  ) as customer_count,
  
  -- active jobs
  (
    SELECT count(*)
    FROM tenant.jobcards j
    WHERE j.tenant_id = t.id
      AND j.status IN ('pending', 'in_progress', 'on_hold')
  ) as active_jobs,
  
  -- completed jobs
  (
    SELECT count(*)
    FROM tenant.jobcards j
    WHERE j.tenant_id = t.id
      AND j.status = 'completed'
  ) as completed_jobs,
  
  -- mechanics
  (
    SELECT count(*)
    FROM tenant.mechanics m
    WHERE m.tenant_id = t.id
  ) as mechanic_count,
  
  -- revenue
  COALESCE(
    (
      SELECT sum(i.total_amount)
      FROM tenant.invoices i
      WHERE i.tenant_id = t.id
        AND i.status = 'paid'
    ),
    0
  ) as total_revenue

FROM tenant.tenants t
ORDER BY t.created_at DESC;

-- =============================================================================
-- VIEW GRANTS
-- =============================================================================

GRANT SELECT ON tenant.tenant_stats_view TO authenticated;
GRANT SELECT ON tenant.tenant_stats_view TO service_role;
GRANT SELECT ON tenant.admin_tenant_overview TO authenticated;
GRANT SELECT ON tenant.admin_tenant_overview TO service_role;

-- End of 0003_views_and_derived.sql
