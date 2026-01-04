-- ============================================================
-- COUNTERS
-- Used for generating sequential numbers like:
--   INV-00001, JOB-00001, EST-00001
-- Per-tenant, concurrency-safe
-- ============================================================

CREATE TABLE IF NOT EXISTS tenant.counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  tenant_id uuid NOT NULL,
  counter_key text NOT NULL,              -- e.g. 'invoice', 'jobcard', 'estimate'
  prefix text NOT NULL,                   -- e.g. 'INV', 'JOB'
  current_value integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT counters_tenant_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE,

  CONSTRAINT counters_unique_per_tenant
    UNIQUE (tenant_id, counter_key)
);


-- ============================================================
-- FUNCTION: get_next_counter_value
-- Atomically increments and returns formatted value
-- Example return: INV-00001
-- ============================================================

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


-- ============================================================
-- Helper: initialize standard counters for a tenant
-- ============================================================

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


-- ============================================================
-- ANALYTICS (Monthly Aggregates)
-- ============================================================

CREATE TABLE IF NOT EXISTS tenant.monthly_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  tenant_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,  -- 1..12

  total_jobs integer NOT NULL DEFAULT 0,
  total_invoices integer NOT NULL DEFAULT 0,

  total_revenue numeric(14,2) NOT NULL DEFAULT 0,
  paid_revenue numeric(14,2) NOT NULL DEFAULT 0,
  outstanding_revenue numeric(14,2) NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT monthly_analytics_tenant_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE,

  CONSTRAINT monthly_analytics_unique
    UNIQUE (tenant_id, year, month)
);


-- ============================================================
-- RLS: counters
-- ============================================================

ALTER TABLE tenant.counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS counters_access ON tenant.counters;
CREATE POLICY counters_access
ON tenant.counters
FOR ALL
USING (
  (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
  OR (auth.jwt() ->> 'tenant_id') = tenant_id::text
)
WITH CHECK (
  (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
  OR (auth.jwt() ->> 'tenant_id') = tenant_id::text
);

-- ============================================================
-- RLS: monthly_analytics
-- ============================================================

ALTER TABLE tenant.monthly_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS monthly_analytics_read ON tenant.monthly_analytics;
CREATE POLICY monthly_analytics_read
ON tenant.monthly_analytics
FOR SELECT
USING (
  (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
  OR (auth.jwt() ->> 'tenant_id') = tenant_id::text
);

DROP POLICY IF EXISTS monthly_analytics_write ON tenant.monthly_analytics;
CREATE POLICY monthly_analytics_write
ON tenant.monthly_analytics
FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
);
DROP POLICY IF EXISTS monthly_analytics_write ON tenant.monthly_analytics;
CREATE POLICY monthly_analytics_write
ON tenant.monthly_analytics
FOR UPDATE
WITH CHECK (
  (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
);

-- Payment method enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum'
  ) THEN
    CREATE TYPE tenant.payment_method_enum AS ENUM (
      'cash',
      'card',
      'upi',
      'bank_transfer',
      'cheque'
    );
  END IF;
END$$;

-- Convert payments.payment_method to enum
-- First drop the default, then convert, then add it back
ALTER TABLE tenant.payments
  ALTER COLUMN payment_method DROP DEFAULT;

ALTER TABLE tenant.payments
  ALTER COLUMN payment_method
  TYPE tenant.payment_method_enum
  USING payment_method::tenant.payment_method_enum;

ALTER TABLE tenant.payments
  ALTER COLUMN payment_method SET DEFAULT 'cash'::tenant.payment_method_enum;



-- Payments analytics indexes
CREATE INDEX IF NOT EXISTS idx_payments_tenant_date
  ON tenant.payments (tenant_id, payment_date);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_method
  ON tenant.payments (tenant_id, payment_method);

-- Invoice lookups
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status
  ON tenant.invoices (tenant_id, status);


------ example useage of get_next_counter_value ------
---- delete when done ----------------------------------------------
-- static async createInvoice(input: {
--   jobcard_id: string
--   customer_id: string
--   vehicle_id: string
-- }) {
--   const tenantId = ensureTenantContext()

--   // 1️⃣ Get invoice number
--   const { data: invoiceNumber, error: counterError } = await supabase
--     .rpc('get_next_counter_value', {
--       p_tenant_id: tenantId,
--       p_counter_key: 'invoice'
--     })

--   if (counterError) throw counterError

--   // 2️⃣ Insert invoice
--   const { data, error } = await supabase
--     .schema('tenant')
--     .from('invoices')
--     .insert({
--       tenant_id: tenantId,
--       invoice_number: invoiceNumber,
--       jobcard_id: input.jobcard_id,
--       customer_id: input.customer_id,
--       vehicle_id: input.vehicle_id,
--       status: 'pending'
--     })
--     .select()
--     .single()

--   if (error) throw error

--   return data
-- }
