-- =========================
-- Session settings (kept minimal)
-- =========================
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =========================
-- Schemas & extensions
-- =========================
CREATE SCHEMA IF NOT EXISTS tenant;

-- Only create extensions you actually need; keep them explicit.
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- If pg_graphql is needed, add it deliberately (team review). It's commented for now.
-- CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;

-- =========================
-- Types
-- =========================
-- Clean ENUM (no trailing comma, lowercase type name to avoid quoting trouble)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'roles' AND typnamespace = 'tenant'::regnamespace) THEN
    CREATE TYPE tenant.roles AS ENUM ('admin','tenant','mechanic','employee');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status' AND typnamespace = 'tenant'::regnamespace) THEN
    CREATE TYPE tenant.invoice_status AS ENUM ('pending','paid','partially_paid','overdue','cancelled');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status' AND typnamespace = 'tenant'::regnamespace) THEN
    CREATE TYPE tenant.payment_status AS ENUM ('initiated','success','failed');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_mode' AND typnamespace = 'tenant'::regnamespace) THEN
    CREATE TYPE tenant.payment_mode AS ENUM ('cash','razorpay','card','upi','bank_transfer');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estimate_status' AND typnamespace = 'tenant'::regnamespace) THEN
    CREATE TYPE tenant.estimate_status AS ENUM ('draft','pending','approved','rejected','expired');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jobcard_status' AND typnamespace = 'tenant'::regnamespace) THEN
    CREATE TYPE tenant.jobcard_status AS ENUM ('created','in_progress','completed','closed','cancelled');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Robust tenant counters (for invoice/estimate/job numbering)
-- =========================
CREATE TABLE IF NOT EXISTS tenant.counters (
  tenant_id uuid PRIMARY KEY,
  invoice_seq bigint DEFAULT 0 NOT NULL,
  estimate_seq bigint DEFAULT 0 NOT NULL,
  job_seq bigint DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- allocator function: returns next value for a named sequence column
CREATE OR REPLACE FUNCTION tenant.next_sequence(p_tenant uuid, p_seq_name text) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_val bigint;
BEGIN
  -- Ensure tenant counter row exists
  INSERT INTO tenant.counters (tenant_id) VALUES (p_tenant)
    ON CONFLICT (tenant_id) DO NOTHING;

  IF p_seq_name = 'invoice' THEN
    UPDATE tenant.counters
      SET invoice_seq = tenant.counters.invoice_seq + 1,
          updated_at = now()
      WHERE tenant_id = p_tenant
      RETURNING invoice_seq INTO v_val;
    RETURN v_val;
  ELSIF p_seq_name = 'estimate' THEN
    UPDATE tenant.counters
      SET estimate_seq = tenant.counters.estimate_seq + 1,
          updated_at = now()
      WHERE tenant_id = p_tenant
      RETURNING estimate_seq INTO v_val;
    RETURN v_val;
  ELSIF p_seq_name = 'job' THEN
    UPDATE tenant.counters
      SET job_seq = tenant.counters.job_seq + 1,
          updated_at = now()
      WHERE tenant_id = p_tenant
      RETURNING job_seq INTO v_val;
    RETURN v_val;
  ELSE
    RAISE EXCEPTION 'unsupported sequence name: %', p_seq_name;
  END IF;
END;
$$;

-- SECURITY: only service_role should be able to execute this allocator from client-facing contexts
REVOKE ALL ON FUNCTION tenant.next_sequence(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION tenant.next_sequence(uuid, text) TO service_role;

-- =========================
-- Public schema tables (if any)
-- =========================
-- DESIGN DECISION: vehicle_make, vehicle_model, and vehicle_category are in PUBLIC schema
-- Rationale:
-- 1. These are reference/master data shared across ALL tenants (Toyota, Honda, etc.)
-- 2. Reduces data duplication - one "Toyota Camry" record serves all tenants
-- 3. Simplifies maintenance - updates apply globally
-- 4. Standard automotive data doesn't need tenant isolation
-- 5. No RLS needed - READ access for authenticated, INSERT/UPDATE for platform admins only
-- 
-- If tenants need custom makes/models, consider a separate tenant.custom_vehicle_models table.
-- =========================

CREATE TABLE IF NOT EXISTS public.vehicle_category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vehicle_make (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  logo_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vehicle_model (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make_id uuid NOT NULL,
  name text NOT NULL,
  model_code text,
  vehicle_category text,
  year_start integer,
  year_end integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT vehicle_model_make_id_fkey FOREIGN KEY (make_id) REFERENCES public.vehicle_make(id) ON DELETE RESTRICT,
  CONSTRAINT vehicle_model_make_id_name_key UNIQUE (make_id, name)
);

-- Indexes for public vehicle tables
CREATE INDEX IF NOT EXISTS idx_vehicle_model_make_id ON public.vehicle_model (make_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_model_category ON public.vehicle_model (vehicle_category);
-- =========================
-- Tenant schema tables
-- =========================
CREATE TABLE IF NOT EXISTS tenant.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
-- If you intend to force RLS on tenants table: do so but create policies later
ALTER TABLE tenant.tenants FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tenant.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  auth_user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  role tenant.roles DEFAULT 'tenant' NOT NULL,
  avatar_url text,
  is_active boolean DEFAULT true NOT NULL,
  last_login timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid,
  CONSTRAINT users_auth_user_id_unique UNIQUE (auth_user_id),
  CONSTRAINT users_tenant_auth_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tenant.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid,
  CONSTRAINT customers_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tenant.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  make uuid NOT NULL,
  model uuid NOT NULL,
  year integer,
  vin text,
  license_plate text,
  color text,
  mileage integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid,
  CONSTRAINT vehicles_make_fkey FOREIGN KEY (make) REFERENCES public.vehicle_make(id) ON DELETE RESTRICT,
  CONSTRAINT vehicles_model_fkey FOREIGN KEY (model) REFERENCES public.vehicle_model(id) ON DELETE RESTRICT,
  CONSTRAINT vehicles_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT vehicles_customer_fkey FOREIGN KEY (customer_id) REFERENCES tenant.customers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tenant.jobcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  job_number text NOT NULL,
  customer_id uuid NOT NULL,
  vehicle_id uuid NOT NULL,
  status tenant.jobcard_status DEFAULT 'created' NOT NULL,
  created_by uuid,
  assigned_mechanic_id uuid,
  description text,
  notes text,
  details jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid,
  CONSTRAINT jobcards_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT jobcards_customer_fkey FOREIGN KEY (customer_id) REFERENCES tenant.customers(id) ON DELETE RESTRICT,
  CONSTRAINT jobcards_vehicle_fkey FOREIGN KEY (vehicle_id) REFERENCES tenant.vehicles(id) ON DELETE RESTRICT,
  CONSTRAINT jobcards_created_by_fkey FOREIGN KEY (created_by) REFERENCES tenant.users(id) ON DELETE SET NULL,
  CONSTRAINT jobcards_assigned_mechanic_fkey FOREIGN KEY (assigned_mechanic_id) REFERENCES tenant.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tenant.estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  vehicle_id uuid NOT NULL,
  jobcard_id uuid,
  estimate_number text DEFAULT '' NOT NULL,
  status tenant.estimate_status DEFAULT 'draft' NOT NULL,
  description text,
  labor_total numeric(12,2) DEFAULT 0 NOT NULL,
  parts_total numeric(12,2) DEFAULT 0 NOT NULL,
  subtotal numeric(12,2) DEFAULT 0 NOT NULL,
  tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
  discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
  total_amount numeric(12,2) DEFAULT 0 NOT NULL,
  currency text DEFAULT 'INR' NOT NULL,
  valid_until timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  rejected_at timestamptz,
  rejected_by uuid,
  rejection_reason text,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid,
  CONSTRAINT estimates_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT estimates_customer_fkey FOREIGN KEY (customer_id) REFERENCES tenant.customers(id) ON DELETE RESTRICT,
  CONSTRAINT estimates_vehicle_fkey FOREIGN KEY (vehicle_id) REFERENCES tenant.vehicles(id) ON DELETE RESTRICT,
  CONSTRAINT estimates_jobcard_fkey FOREIGN KEY (jobcard_id) REFERENCES tenant.jobcards(id) ON DELETE SET NULL,
  CONSTRAINT estimates_created_by_fkey FOREIGN KEY (created_by) REFERENCES tenant.users(id) ON DELETE SET NULL,
  CONSTRAINT estimates_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES tenant.users(id) ON DELETE SET NULL,
  CONSTRAINT estimates_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES tenant.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tenant.estimate_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL,
  part_id uuid,
  custom_name text,
  custom_part_number text,
  description text,
  qty integer NOT NULL CHECK (qty > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  labor_cost numeric(10,2) DEFAULT 0 NOT NULL CHECK (labor_cost >= 0),
  total numeric(10,2) GENERATED ALWAYS AS (((qty::numeric * unit_price) + labor_cost)) STORED,
  created_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  CONSTRAINT estimate_items_estimate_fkey FOREIGN KEY (estimate_id) REFERENCES tenant.estimates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tenant.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  jobcard_id uuid,
  estimate_id uuid,
  invoice_number text,
  status tenant.invoice_status DEFAULT 'pending' NOT NULL,
  subtotal numeric(12,2) DEFAULT 0 NOT NULL,
  tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
  discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
  total_amount numeric(12,2) DEFAULT 0 NOT NULL,
  paid_amount numeric(12,2) DEFAULT 0 NOT NULL,
  balance numeric(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  invoice_date timestamptz DEFAULT now() NOT NULL,
  due_date timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid,
  CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT invoices_customer_fkey FOREIGN KEY (customer_id) REFERENCES tenant.customers(id) ON DELETE RESTRICT,
  CONSTRAINT invoices_jobcard_fkey FOREIGN KEY (jobcard_id) REFERENCES tenant.jobcards(id) ON DELETE SET NULL,
  CONSTRAINT invoices_estimate_fkey FOREIGN KEY (estimate_id) REFERENCES tenant.estimates(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tenant.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  mode tenant.payment_mode NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status tenant.payment_status DEFAULT 'initiated' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  paid_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid,
  CONSTRAINT payment_transactions_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT payment_transactions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES tenant.invoices(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tenant.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_method tenant.payment_mode DEFAULT 'cash' NOT NULL,
  status tenant.payment_status DEFAULT 'success' NOT NULL,
  reference_number text,
  gateway_ref text,
  notes text,
  received_by uuid,
  payment_date timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid,
  CONSTRAINT payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES tenant.invoices(id) ON DELETE RESTRICT,
  CONSTRAINT payments_received_by_fkey FOREIGN KEY (received_by) REFERENCES tenant.users(id) ON DELETE SET NULL
);



-- =========================
-- Secure utility functions
-- =========================

-- Safer get_or_create_user_tenant:
-- - Identifies tenant by users.auth_user_id
-- - Uses advisory lock to prevent race
-- - Inserts tenant, then inserts/updates tenant.users row
CREATE OR REPLACE FUNCTION public.get_or_create_user_tenant(p_auth_user_id uuid) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_email text;
  v_lock_key bigint;
BEGIN
  -- do not allow anonymous executor; we'll restrict EXECUTE later
  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_user_id is required';
  END IF;

  -- compute 64-bit lock key from md5(user_id) - stable per user
  v_lock_key := ('x' || substr(md5(p_auth_user_id::text),1,15))::bit(60)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 1) if the user already has a tenant link, return it
  SELECT tenant_id INTO v_tenant_id
  FROM tenant.users
  WHERE auth_user_id = p_auth_user_id
  LIMIT 1;

  IF v_tenant_id IS NOT NULL THEN
    RETURN v_tenant_id;
  END IF;

  -- 2) pull email from auth.users for friendly name (may be null)
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_auth_user_id;

  -- 3) create tenant
  INSERT INTO tenant.tenants (id, name, slug, metadata, created_at)
  VALUES (gen_random_uuid(),
          'My Garage - ' || COALESCE(v_email, 'New User'),
          lower(regexp_replace(coalesce(split_part(v_email,'@',1),'user') , '[^a-z0-9]+','-','g')) || '-' || substr(md5(gen_random_uuid()::text),1,6),
          '{}'::jsonb,
          now()
  )
  RETURNING id INTO v_tenant_id;

  -- 4) create or upsert tenant.users mapping (auth_user_id unique)
  INSERT INTO tenant.users (id, tenant_id, auth_user_id, name, email, role, created_at, updated_at, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, p_auth_user_id, COALESCE(v_email, p_auth_user_id::text), v_email, 'admin'::tenant.roles, now(), now(), true)
  ON CONFLICT (auth_user_id) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id,
        updated_at = now(),
        name = COALESCE(EXCLUDED.name, tenant.users.name),
        email = COALESCE(EXCLUDED.email, tenant.users.email)
  RETURNING tenant_id INTO v_tenant_id;

  RETURN v_tenant_id;
END;
$$;

-- SECURITY: revoke public and grant only to service_role (call from backend with service key)
REVOKE ALL ON FUNCTION public.get_or_create_user_tenant(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_or_create_user_tenant(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_tenant(uuid) TO service_role;

-- test helper should be service-only too (if you keep it)
CREATE OR REPLACE FUNCTION public.test_tenant_insert() RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  t_id uuid;
  u_id uuid := gen_random_uuid();
  res jsonb := '{}'::jsonb;
BEGIN
  -- attempt to create tenant and row, but restrict exec to service_role below
  BEGIN
    INSERT INTO tenant.tenants (id, name, created_at) VALUES (gen_random_uuid(), 'Test Garage', now()) RETURNING id INTO t_id;
    res := res || jsonb_build_object('tenant_created', true, 'tenant_id', t_id);
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('tenant_created', false, 'tenant_error', SQLERRM);
    RETURN res;
  END;

  BEGIN
    INSERT INTO tenant.users (id, tenant_id, auth_user_id, email, name, role, created_at)
    VALUES (u_id, t_id, u_id, 'test@example.com', 'Test User', 'tenant', now());
    res := res || jsonb_build_object('user_created', true);
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('user_created', false, 'user_error', SQLERRM);
    DELETE FROM tenant.tenants WHERE id = t_id;
    RETURN res;
  END;

  DELETE FROM tenant.users WHERE id = u_id;
  DELETE FROM tenant.tenants WHERE id = t_id;
  res := res || jsonb_build_object('cleanup', 'success');
  RETURN res;
END;
$$;

REVOKE ALL ON FUNCTION public.test_tenant_insert() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.test_tenant_insert() TO service_role;

-- If you have set_config wrapper, restrict its EXECUTE
CREATE OR REPLACE FUNCTION public.set_config(parameter text, value text) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config(parameter, value, false);
END;
$$;

REVOKE ALL ON FUNCTION public.set_config(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_config(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_config(text, text) TO service_role;

-- =========================
-- Trigger-safe number generators (use tenant.next_sequence)
-- Replace your existing MAX(...) triggers with these
-- =========================

CREATE OR REPLACE FUNCTION tenant.generate_invoice_number() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prefix text;
  seq_num bigint;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number <> '' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(invoice_prefix, 'INV-') INTO prefix FROM tenant.settings WHERE tenant_id = NEW.tenant_id LIMIT 1;

  seq_num := tenant.next_sequence(NEW.tenant_id, 'invoice');

  NEW.invoice_number := prefix || LPAD(seq_num::text, 6, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION tenant.generate_estimate_number() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prefix text;
  seq_num bigint;
BEGIN
  IF NEW.estimate_number IS NOT NULL AND NEW.estimate_number <> '' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(estimate_prefix, 'EST-') INTO prefix FROM tenant.settings WHERE tenant_id = NEW.tenant_id LIMIT 1;

  seq_num := tenant.next_sequence(NEW.tenant_id, 'estimate');

  NEW.estimate_number := prefix || LPAD(seq_num::text, 6, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION tenant.generate_job_number() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prefix text;
  seq_num bigint;
BEGIN
  IF NEW.job_number IS NOT NULL AND NEW.job_number <> '' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(job_prefix, 'JOB-') INTO prefix FROM tenant.settings WHERE tenant_id = NEW.tenant_id LIMIT 1;

  seq_num := tenant.next_sequence(NEW.tenant_id, 'job');

  NEW.job_number := prefix || LPAD(seq_num::text, 6, '0');
  RETURN NEW;
END;
$$;
--TODO: this is a safe code to install triggers; uncomment and run once to set up triggers


-- Install triggers (replace existing ones)
-- DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON tenant.invoices;
-- CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON tenant.invoices
--   FOR EACH ROW WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '') EXECUTE FUNCTION tenant.generate_invoice_number();

-- DROP TRIGGER IF EXISTS generate_estimate_number_trigger ON tenant.estimates;
-- CREATE TRIGGER generate_estimate_number_trigger BEFORE INSERT ON tenant.estimates
--   FOR EACH ROW WHEN (NEW.estimate_number IS NULL OR NEW.estimate_number = '') EXECUTE FUNCTION tenant.generate_estimate_number();

-- DROP TRIGGER IF EXISTS generate_jobcard_number ON tenant.jobcards;
-- CREATE TRIGGER generate_jobcard_number BEFORE INSERT ON tenant.jobcards
--   FOR EACH ROW WHEN (NEW.job_number IS NULL OR NEW.job_number = '') EXECUTE FUNCTION tenant.generate_job_number();

-- =========================
-- Foreign key constraints already defined in table creation above
-- This section kept for reference - no changes needed
-- =========================

-- =========================
-- Row Level Security (RLS) Policies
-- =========================
-- Pattern: All tenant.* tables use JWT claim 'tenant_id' for isolation
-- JWT must include: { tenant_id: uuid, role: 'admin'|'tenant'|'mechanic'|'employee' }
-- Service role bypasses RLS automatically
-- =========================

-- Enable RLS on all tenant schema tables
ALTER TABLE tenant.tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant.users FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant.customers FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant.vehicles FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant.invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant.payment_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant.payments FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant.estimate_items FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant.estimates FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant.jobcards FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant.counters FORCE ROW LEVEL SECURITY;

-- =========================
-- TENANT.TENANTS Policies
-- =========================
CREATE POLICY tenants_select_own ON tenant.tenants
  FOR SELECT
  USING (id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY tenants_update_own ON tenant.tenants
  FOR UPDATE
  USING (id::text = (auth.jwt() ->> 'tenant_id'))
  WITH CHECK (id::text = (auth.jwt() ->> 'tenant_id'));

-- =========================
-- TENANT.USERS Policies
-- =========================
-- Select: users can see their own record + all users in their tenant
CREATE POLICY users_select_policy ON tenant.users
  FOR SELECT
  USING (
    auth_user_id = auth.uid() OR
    (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL)
  );

-- Insert: only service_role or platform admins (handled server-side)
CREATE POLICY users_insert_policy ON tenant.users
  FOR INSERT
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- Update: users can update their own record, admins can update tenant users
CREATE POLICY users_update_policy ON tenant.users
  FOR UPDATE
  USING (
    auth_user_id = auth.uid() OR
    (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND (auth.jwt() ->> 'role') = 'admin')
  )
  WITH CHECK (
    auth_user_id = auth.uid() OR
    (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND (auth.jwt() ->> 'role') = 'admin')
  );

-- Soft delete: only admins
CREATE POLICY users_delete_policy ON tenant.users
  FOR UPDATE
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id') AND
    (auth.jwt() ->> 'role') = 'admin' AND
    deleted_at IS NULL
  );

-- =========================
-- TENANT.CUSTOMERS Policies
-- =========================
CREATE POLICY customers_select_policy ON tenant.customers
  FOR SELECT
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL);

CREATE POLICY customers_insert_policy ON tenant.customers
  FOR INSERT
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY customers_update_policy ON tenant.customers
  FOR UPDATE
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL)
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY customers_delete_policy ON tenant.customers
  FOR UPDATE
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id') AND
    (auth.jwt() ->> 'role') IN ('admin', 'tenant') AND
    deleted_at IS NULL
  );

-- =========================
-- TENANT.VEHICLES Policies
-- =========================
CREATE POLICY vehicles_select_policy ON tenant.vehicles
  FOR SELECT
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL);

CREATE POLICY vehicles_insert_policy ON tenant.vehicles
  FOR INSERT
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY vehicles_update_policy ON tenant.vehicles
  FOR UPDATE
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL)
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY vehicles_delete_policy ON tenant.vehicles
  FOR UPDATE
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id') AND
    (auth.jwt() ->> 'role') IN ('admin', 'tenant') AND
    deleted_at IS NULL
  );

-- =========================
-- TENANT.JOBCARDS Policies
-- =========================
CREATE POLICY jobcards_select_policy ON tenant.jobcards
  FOR SELECT
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL);

CREATE POLICY jobcards_insert_policy ON tenant.jobcards
  FOR INSERT
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY jobcards_update_policy ON tenant.jobcards
  FOR UPDATE
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL)
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY jobcards_delete_policy ON tenant.jobcards
  FOR UPDATE
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id') AND
    (auth.jwt() ->> 'role') IN ('admin', 'tenant') AND
    deleted_at IS NULL
  );

-- =========================
-- TENANT.ESTIMATES Policies
-- =========================
CREATE POLICY estimates_select_policy ON tenant.estimates
  FOR SELECT
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL);

CREATE POLICY estimates_insert_policy ON tenant.estimates
  FOR INSERT
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY estimates_update_policy ON tenant.estimates
  FOR UPDATE
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL)
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY estimates_delete_policy ON tenant.estimates
  FOR UPDATE
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id') AND
    (auth.jwt() ->> 'role') IN ('admin', 'tenant') AND
    deleted_at IS NULL
  );

-- =========================
-- TENANT.ESTIMATE_ITEMS Policies
-- =========================
CREATE POLICY estimate_items_select_policy ON tenant.estimate_items
  FOR SELECT
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM tenant.estimates e
      WHERE e.id = estimate_items.estimate_id
        AND e.tenant_id::text = (auth.jwt() ->> 'tenant_id')
        AND e.deleted_at IS NULL
    )
  );

CREATE POLICY estimate_items_insert_policy ON tenant.estimate_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant.estimates e
      WHERE e.id = estimate_items.estimate_id
        AND e.tenant_id::text = (auth.jwt() ->> 'tenant_id')
    )
  );

CREATE POLICY estimate_items_update_policy ON tenant.estimate_items
  FOR UPDATE
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM tenant.estimates e
      WHERE e.id = estimate_items.estimate_id
        AND e.tenant_id::text = (auth.jwt() ->> 'tenant_id')
        AND e.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant.estimates e
      WHERE e.id = estimate_items.estimate_id
        AND e.tenant_id::text = (auth.jwt() ->> 'tenant_id')
    )
  );

-- =========================
-- TENANT.INVOICES Policies
-- =========================
CREATE POLICY invoices_select_policy ON tenant.invoices
  FOR SELECT
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL);

CREATE POLICY invoices_insert_policy ON tenant.invoices
  FOR INSERT
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY invoices_update_policy ON tenant.invoices
  FOR UPDATE
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL)
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY invoices_delete_policy ON tenant.invoices
  FOR UPDATE
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id') AND
    (auth.jwt() ->> 'role') IN ('admin', 'tenant') AND
    deleted_at IS NULL
  );
-- =========================
-- TENANT.PAYMENT_TRANSACTIONS Policies
-- =========================
CREATE POLICY payment_tx_select_policy ON tenant.payment_transactions
  FOR SELECT
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL);

CREATE POLICY payment_tx_insert_policy ON tenant.payment_transactions
  FOR INSERT
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY payment_tx_update_policy ON tenant.payment_transactions
  FOR UPDATE
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id') AND
    (auth.jwt() ->> 'role') IN ('admin', 'tenant') AND
    deleted_at IS NULL
  )
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- =========================
-- TENANT.PAYMENTS Policies
-- =========================
CREATE POLICY payments_select_policy ON tenant.payments
  FOR SELECT
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id') AND deleted_at IS NULL);

CREATE POLICY payments_insert_policy ON tenant.payments
  FOR INSERT
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY payments_update_policy ON tenant.payments
  FOR UPDATE
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id') AND
    (auth.jwt() ->> 'role') IN ('admin', 'tenant') AND
    deleted_at IS NULL
  )
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- =========================
-- TENANT.COUNTERS Policies=
-- TENANT.COUNTERS Policies
-- =========================
-- Only accessible via tenant.next_sequence function which is SECURITY DEFINER
CREATE POLICY counters_select_policy ON tenant.counters
  FOR SELECT
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- =========================
-- PUBLIC SCHEMA Policies
-- =========================
-- Public vehicle tables: read-only for authenticated users
ALTER TABLE public.vehicle_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_make ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_model ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicle_category_select_all ON public.vehicle_category
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY vehicle_make_select_all ON public.vehicle_make
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY vehicle_model_select_all ON public.vehicle_model
  FOR SELECT
  TO authenticated
  USING (true);

-- =========================
-- Privileges: minimal & safe defaults
-- - Revoke dangerous public usage
-- - Grant authenticated the minimal CRUD on tenant schema (RLS will determine row visibility)
-- - Do NOT grant ANYTHING to anon unless intentional
-- =========================

-- Revoke previously dangerous grants (defensive)
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA tenant FROM PUBLIC;

-- Grant schema USAGE to authenticated (so API clients can reference the schema path)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA tenant TO authenticated;

-- Grant schema access to service_role (bypasses RLS, for admin operations)
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON SCHEMA tenant TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA tenant TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tenant TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tenant TO service_role;

-- Grant table-level privileges to authenticated (do not grant ALL globally, rely on RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA tenant TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Future objects: keep safe defaults (no ALL to anon)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA tenant GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;

-- Revoke any accidental function grants to authenticated/public on SECURITY DEFINER functions created earlier
REVOKE ALL ON FUNCTION public.get_or_create_user_tenant(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.test_tenant_insert() FROM authenticated;
REVOKE ALL ON FUNCTION public.set_config(text, text) FROM authenticated;

-- =========================
-- Indexes: comprehensive indexes on FKs, tenant_id, and common query patterns
-- =========================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON tenant.users (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON tenant.users (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON tenant.users (tenant_id, role) WHERE deleted_at IS NULL;

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON tenant.customers (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email ON tenant.customers (tenant_id, email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_phone ON tenant.customers (tenant_id, phone) WHERE deleted_at IS NULL;

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON tenant.vehicles (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON tenant.vehicles (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON tenant.vehicles (make);
-- Payments indexes EXISTS idx_estimates_created_by ON tenant.estimates (created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_valid_until ON tenant.estimates (tenant_id, valid_until) WHERE deleted_at IS NULL AND valid_until IS NOT NULL;

-- Estimate items indexes
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate_id ON tenant.estimate_items (estimate_id) WHERE deleted_at IS NULL;

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON tenant.invoices (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON tenant.invoices (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_jobcard_id ON tenant.invoices (jobcard_id) WHERE jobcard_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_estimate_id ON tenant.invoices (estimate_id) WHERE estimate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON tenant.invoices (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON tenant.invoices (tenant_id, invoice_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_balance ON tenant.invoices (tenant_id, balance) WHERE deleted_at IS NULL AND balance > 0;

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_tx_tenant_id ON tenant.payment_transactions (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payment_tx_invoice ON tenant.payment_transactions (invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON tenant.payment_transactions (tenant_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payment_tx_razorpay_order ON tenant.payment_transactions (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

-- Payments indexes
-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON tenant.vehicles (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON tenant.vehicles (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON tenant.vehicles (make);
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON tenant.vehicles (model);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON tenant.vehicles (vin) WHERE vin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON tenant.vehicles (tenant_id, license_plate) WHERE license_plate IS NOT NULL;

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON tenant.invoices (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON tenant.invoices (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_jobcard_id ON tenant.invoices (jobcard_id) WHERE jobcard_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_estimate_id ON tenant.invoices (estimate_id) WHERE estimate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON tenant.invoices (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON tenant.invoices (tenant_id, invoice_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_balance ON tenant.invoices (tenant_id, balance) WHERE deleted_at IS NULL AND balance > 0;


-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON tenant.payments (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON tenant.payments (invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_received_by ON tenant.payments (received_by) WHERE received_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_date ON tenant.payments (tenant_id, payment_date DESC) WHERE deleted_at IS NULL;

-- Estimates indexes
CREATE INDEX IF NOT EXISTS idx_estimates_tenant_id ON tenant.estimates (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_customer_id ON tenant.estimates (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_vehicle_id ON tenant.estimates (vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_jobcard_id ON tenant.estimates (jobcard_id) WHERE jobcard_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_status ON tenant.estimates (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_created_by ON tenant.estimates (created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_valid_until ON tenant.estimates (tenant_id, valid_until) WHERE deleted_at IS NULL AND valid_until IS NOT NULL;

-- Estimate items indexes
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate_id ON tenant.estimate_items (estimate_id) WHERE deleted_at IS NULL;

-- Jobcards indexes
CREATE INDEX IF NOT EXISTS idx_jobcards_tenant_id ON tenant.jobcards (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobcards_customer_id ON tenant.jobcards (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobcards_vehicle_id ON tenant.jobcards (vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobcards_status ON tenant.jobcards (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_date ON tenant.payments (tenant_id, payment_date DESC) WHERE deleted_at IS NULL;

-- =========================