-- schema.sql (FINAL single-file)
-- Option C: Simple tenant isolation + platform_admin & service_role bypass
-- WARNING: destructive if you DROP objects in prod. Test on staging/local first.

-- SESSION & ENV
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- useful text index ops (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SCHEMAS
CREATE SCHEMA IF NOT EXISTS tenant;
CREATE SCHEMA IF NOT EXISTS vault;
CREATE SCHEMA IF NOT EXISTS graphql;

-- ENUMS (idempotent creation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'roles' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname='tenant')) THEN
    CREATE TYPE tenant.roles AS ENUM ('tenant','frontdesk');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_admin_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname='public')) THEN
    CREATE TYPE public.platform_admin_role AS ENUM ('platform_admin','employee');
  END IF;
END$$;

-- TABLES: PUBLIC (global reference + platform admins)
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  role public.platform_admin_role NOT NULL DEFAULT 'platform_admin'::public.platform_admin_role,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- trigger for updated_at (generic)
CREATE OR REPLACE FUNCTION public.update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



CREATE TABLE public.vehicle_category (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  CONSTRAINT vehicle_category_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vehicle_make (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_make_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vehicle_model (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  make_id uuid NOT NULL,
  name text NOT NULL,
  model_code text,
  vehicle_category uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_model_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_model_make_id_name_key UNIQUE (make_id, name),
  CONSTRAINT vehicle_model_make_id_fkey FOREIGN KEY (make_id) REFERENCES public.vehicle_make(id),
  CONSTRAINT vehicle_model_vehicle_category_fkey FOREIGN KEY (vehicle_category) REFERENCES public.vehicle_category(id)
);

DROP TRIGGER IF EXISTS trg_platform_admins_updated_at ON public.platform_admins;
CREATE TRIGGER trg_platform_admins_updated_at
  BEFORE UPDATE ON public.platform_admins
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamps();

-- TENANT TABLES (core)
CREATE TABLE IF NOT EXISTS tenant.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS tenant.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  auth_user_id uuid NOT NULL, -- maps to auth.users.id
  name text NOT NULL,
  email text,
  phone text,
  role tenant.roles NOT NULL DEFAULT 'tenant'::tenant.roles,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  reg_no text NOT NULL,
  vin text,
  make_id uuid references public.vehicle_make(id),
  model_id uuid references public.vehicle_model(id),
  year smallint,
  odometer integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.mechanics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  skills text[],
  hourly_rate numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.jobcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  job_number text NOT NULL,
  vehicle_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  created_by uuid,
  assigned_mechanic_id uuid,
  status text NOT NULL DEFAULT 'created',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sku text,
  name text NOT NULL,
  description text,
  unit_cost numeric(12,2) DEFAULT 0,
  sell_price numeric(12,2) DEFAULT 0,
  stock_on_hand integer DEFAULT 0,
  reorder_level integer DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.part_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  jobcard_id uuid NOT NULL,
  part_id uuid NOT NULL,
  qty integer NOT NULL,
  unit_price numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.estimate_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL,
  part_id uuid,
  custom_name text,
  custom_part_number text,
  description text,
  qty integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  labor_cost numeric(10,2) DEFAULT 0,
  total numeric(12,2) GENERATED ALWAYS AS ((qty::numeric * unit_price) + labor_cost) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  jobcard_id uuid,
  created_by uuid,
  status text NOT NULL DEFAULT 'draft',
  total_amount numeric(12,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'INR',
  items jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  estimate_number text DEFAULT ''::text NOT NULL,
  customer_id uuid,
  vehicle_id uuid,
  description text,
  labor_total numeric(10,2) DEFAULT 0,
  parts_total numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  valid_until timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text
);

CREATE TABLE IF NOT EXISTS tenant.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  jobcard_id uuid,
  estimate_id uuid,
  invoice_number text,
  status text NOT NULL DEFAULT 'pending',
  subtotal numeric(12,2) DEFAULT 0,
  tax numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) DEFAULT 0,
  due_date date,
  issued_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_mode text,
  customer_id uuid,
  invoice_date timestamptz NOT NULL DEFAULT now(),
  tax_amount numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  paid_amount numeric(10,2) DEFAULT 0,
  balance numeric(12,2) DEFAULT 0,
  file_key text,
  filename text,
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL,
  method text,
  gateway_ref text,
  status text NOT NULL DEFAULT 'initiated',
  paid_at timestamptz,
  payment_date timestamptz NOT NULL DEFAULT now(),
  payment_method text NOT NULL DEFAULT 'cash',
  reference_number text,
  notes text,
  received_by uuid
);

CREATE TABLE IF NOT EXISTS tenant.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  mode text NOT NULL,
  amount numeric(12,2) NOT NULL,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status text NOT NULL DEFAULT 'initiated',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE TABLE IF NOT EXISTS tenant.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  part_id uuid NOT NULL,
  transaction_type text NOT NULL,
  quantity integer NOT NULL,
  unit_cost numeric(10,2),
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid,
  jobcard_id uuid,
  channel text NOT NULL,
  template text,
  payload jsonb,
  status text NOT NULL DEFAULT 'queued',
  sent_at timestamptz,
  user_id uuid,
  category text,
  entity_type text,
  entity_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  jobcard_id uuid,
  user_id uuid,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  entity_type text,
  entity_id uuid,
  ip_address inet,
  user_agent text
);

CREATE TABLE IF NOT EXISTS tenant.dvi_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.dvi_checkpoint_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.dvi_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  template_id uuid,
  category_id uuid,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_required boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.dvi_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jobcard_id uuid NOT NULL,
  checkpoint_id uuid NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  checkpoint_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.dvi_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dvi_item_id uuid NOT NULL,
  storage_path text NOT NULL,
  url text NOT NULL,
  caption text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE,
  tax_rate numeric(5,2) DEFAULT 0,
  currency text DEFAULT 'INR',
  timezone text DEFAULT 'Asia/Kolkata',
  sms_enabled boolean DEFAULT false,
  email_enabled boolean DEFAULT false,
  whatsapp_enabled boolean DEFAULT false,
  invoice_prefix text DEFAULT 'INV-',
  job_prefix text DEFAULT 'JOB-',
  estimate_prefix text DEFAULT 'EST-',
  invoice_footer text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant.razorpay_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE,
  key_id text NOT NULL,
  key_secret text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PRIMARY KEYS & UNIQUE constraints already defined inline. Add important UNIQUEs:
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_tenant_id_reg_no_key ON tenant.vehicles (tenant_id, reg_no);


-- FOREIGN KEYS (idempotent via DROP/ADD)
-- Use restrict/set null where appropriate to avoid destructive cascades for accounting data
ALTER TABLE IF EXISTS tenant.users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;
ALTER TABLE IF EXISTS tenant.users ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS tenant.users DROP CONSTRAINT IF EXISTS users_auth_user_id_fkey;
ALTER TABLE IF EXISTS tenant.users ADD CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- other representative FKs (add the rest as needed)
ALTER TABLE IF EXISTS tenant.customers DROP CONSTRAINT IF EXISTS customers_tenant_id_fkey;
ALTER TABLE IF EXISTS tenant.customers ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS tenant.vehicles DROP CONSTRAINT IF EXISTS vehicles_tenant_id_fkey;
ALTER TABLE IF EXISTS tenant.vehicles ADD CONSTRAINT vehicles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS tenant.vehicles DROP CONSTRAINT IF EXISTS vehicles_customer_id_fkey;
ALTER TABLE IF EXISTS tenant.vehicles ADD CONSTRAINT vehicles_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES tenant.customers(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS tenant.jobcards DROP CONSTRAINT IF EXISTS jobcards_tenant_id_fkey;
ALTER TABLE IF EXISTS tenant.jobcards ADD CONSTRAINT jobcards_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS tenant.jobcards DROP CONSTRAINT IF EXISTS jobcards_customer_id_fkey;
ALTER TABLE IF EXISTS tenant.jobcards ADD CONSTRAINT jobcards_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES tenant.customers(id) ON DELETE RESTRICT;
ALTER TABLE IF EXISTS tenant.jobcards DROP CONSTRAINT IF EXISTS jobcards_vehicle_id_fkey;
ALTER TABLE IF EXISTS tenant.jobcards ADD CONSTRAINT jobcards_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES tenant.vehicles(id) ON DELETE RESTRICT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON tenant.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON tenant.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON tenant.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobcards_tenant_id ON tenant.jobcards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON tenant.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_estimates_tenant_id ON tenant.estimates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parts_tenant_id ON tenant.parts(tenant_id);

-- DEFAULT PRIVILEGES & SCHEMA USAGE (fixes "permission denied for schema tenant")
GRANT USAGE ON SCHEMA tenant TO authenticated;
GRANT USAGE ON SCHEMA tenant TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA tenant TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA tenant GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant GRANT ALL PRIVILEGES ON TABLES TO service_role;

-- ENABLE RLS on tenant tables and platform_admins (idempotent)
ALTER TABLE IF EXISTS public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.jobcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.part_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.dvi_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.dvi_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.dvi_checkpoints ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: SIMPLE PATTERN (service_role/platform_admin bypass; tenant_id isolation)
-- Platform admins: full access if JWT role is platform_admin or service_role, or owner of the row
DROP POLICY IF EXISTS platform_admins_all ON public.platform_admins;
CREATE POLICY platform_admins_all
  ON public.platform_admins
  FOR ALL
  USING (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR auth_user_id = auth.uid()
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR auth_user_id = auth.uid()
  );

-- Helper predicate (not a DB function; inline used in policies): (auth.jwt() ->> 'role') IN ('service_role','platform_admin')

-- Tenants: only global or tenant owners/admins (tenant_id match)
DROP POLICY IF EXISTS tenants_select ON tenant.tenants;
CREATE POLICY tenants_select ON tenant.tenants FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR ((auth.jwt() ->> 'tenant_id') = id::text AND (auth.jwt() ->> 'role') IN ('tenant'))
  );

DROP POLICY IF EXISTS tenants_insert ON tenant.tenants;
CREATE POLICY tenants_insert ON tenant.tenants FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') IN ('service_role','platform_admin'));

DROP POLICY IF EXISTS tenants_update ON tenant.tenants;
CREATE POLICY tenants_update ON tenant.tenants FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR ((auth.jwt() ->> 'tenant_id') = id::text AND (auth.jwt() ->> 'role') IN ('tenant'))
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR ((auth.jwt() ->> 'tenant_id') = id::text AND (auth.jwt() ->> 'role') IN ('tenant'))
  );

-- Users table policies
DROP POLICY IF EXISTS users_select ON tenant.users;
CREATE POLICY users_select ON tenant.users FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant'))
    OR auth_user_id = auth.uid()
  );

DROP POLICY IF EXISTS users_insert ON tenant.users;
CREATE POLICY users_insert ON tenant.users FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant'))
  );

DROP POLICY IF EXISTS users_update ON tenant.users;
CREATE POLICY users_update ON tenant.users FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant'))
    OR auth_user_id = auth.uid()
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant'))
    OR auth_user_id = auth.uid()
  );

DROP POLICY IF EXISTS users_delete ON tenant.users;
CREATE POLICY users_delete ON tenant.users FOR DELETE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR ((auth.jwt() ->> 'tenant_id') = tenant_id::text AND (auth.jwt() ->> 'role') IN ('tenant'))
  );

-- Generic tenant-scoped policy generator pattern used below: allow service_role/platform_admin OR tenant_id match
-- Customers
DROP POLICY IF EXISTS customers_select ON tenant.customers;
CREATE POLICY customers_select ON tenant.customers FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS customers_insert ON tenant.customers;
CREATE POLICY customers_insert ON tenant.customers FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS customers_update ON tenant.customers;
CREATE POLICY customers_update ON tenant.customers FOR UPDATE
  USING ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text)
  WITH CHECK ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text);

DROP POLICY IF EXISTS customers_delete ON tenant.customers;
CREATE POLICY customers_delete ON tenant.customers FOR DELETE
  USING ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text);

-- Vehicles (same pattern)
DROP POLICY IF EXISTS vehicles_select ON tenant.vehicles;
CREATE POLICY vehicles_select ON tenant.vehicles FOR SELECT
  USING ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text);

DROP POLICY IF EXISTS vehicles_insert ON tenant.vehicles;
CREATE POLICY vehicles_insert ON tenant.vehicles FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text);

DROP POLICY IF EXISTS vehicles_update ON tenant.vehicles;
CREATE POLICY vehicles_update ON tenant.vehicles FOR UPDATE
  USING ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text)
  WITH CHECK ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text);

DROP POLICY IF EXISTS vehicles_delete ON tenant.vehicles;
CREATE POLICY vehicles_delete ON tenant.vehicles FOR DELETE
  USING ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text);

-- Jobcards, Estimates, Invoices, Payments, Parts, Notifications, Activities follow same pattern:
-- (for brevity, apply the same policy pattern; they are defined above for key tables)
-- If you want me to generate distinct policies per table, I will expand them.

-- Helpful comment referring to original JWT policy file (for mapping & values). See earlier migration for policy intent. :contentReference[oaicite:2]{index=2}
-- Also platform_admins structure originated from your platform migration. :contentReference[oaicite:3]{index=3}

-- END OF SCHEMA



--- second migration file content below ---
-- 1) Replace platform_admins policy with idempotent drop/create that checks app_metadata.role too
DROP POLICY IF EXISTS platform_admins_all ON public.platform_admins;
CREATE POLICY platform_admins_all
  ON public.platform_admins
  FOR ALL
  USING (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR auth_user_id = auth.uid()
  )
  WITH CHECK (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR auth_user_id = auth.uid()
  );

-- 2) Example pattern to use for tenant-level policies:
-- Use (auth.jwt() ->> 'tenant_id') = tenant_id::text for tenant isolation AND check both top-level role and app_metadata.role for admin bypass.
-- Example for tenant.customers:
DROP POLICY IF EXISTS customers_select ON tenant.customers;
CREATE POLICY customers_select ON tenant.customers FOR SELECT
  USING (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );


-- Estimate items: tenant ownership verified via tenant.estimates
DROP POLICY IF EXISTS estimate_items_select ON tenant.estimate_items;
CREATE POLICY estimate_items_select ON tenant.estimate_items FOR SELECT
  USING (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1 FROM tenant.estimates e
      WHERE e.id = estimate_id
        AND (auth.jwt() ->> 'tenant_id') = e.tenant_id::text
    )
  );

DROP POLICY IF EXISTS estimate_items_insert ON tenant.estimate_items;
CREATE POLICY estimate_items_insert ON tenant.estimate_items FOR INSERT
  WITH CHECK (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1 FROM tenant.estimates e
      WHERE e.id = estimate_id
        AND (auth.jwt() ->> 'tenant_id') = e.tenant_id::text
    )
  );

DROP POLICY IF EXISTS estimate_items_update ON tenant.estimate_items;
CREATE POLICY estimate_items_update ON tenant.estimate_items FOR UPDATE
  USING (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1 FROM tenant.estimates e
      WHERE e.id = estimate_id
        AND (auth.jwt() ->> 'tenant_id') = e.tenant_id::text
    )
  )
  WITH CHECK (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1 FROM tenant.estimates e
      WHERE e.id = estimate_id
        AND (auth.jwt() ->> 'tenant_id') = e.tenant_id::text
    )
  );

DROP POLICY IF EXISTS estimate_items_delete ON tenant.estimate_items;
CREATE POLICY estimate_items_delete ON tenant.estimate_items FOR DELETE
  USING (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1 FROM tenant.estimates e
      WHERE e.id = estimate_id
        AND (auth.jwt() ->> 'tenant_id') = e.tenant_id::text
    )
  );


-- DVI items: tenant ownership verified via tenant.jobcards
DROP POLICY IF EXISTS dvi_items_select ON tenant.dvi_items;
CREATE POLICY dvi_items_select ON tenant.dvi_items FOR SELECT
  USING (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j
      WHERE j.id = jobcard_id
        AND (auth.jwt() ->> 'tenant_id') = j.tenant_id::text
    )
  );

DROP POLICY IF EXISTS dvi_items_insert ON tenant.dvi_items;
CREATE POLICY dvi_items_insert ON tenant.dvi_items FOR INSERT
  WITH CHECK (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j
      WHERE j.id = jobcard_id
        AND (auth.jwt() ->> 'tenant_id') = j.tenant_id::text
    )
  );

DROP POLICY IF EXISTS dvi_items_update ON tenant.dvi_items;
CREATE POLICY dvi_items_update ON tenant.dvi_items FOR UPDATE
  USING (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j
      WHERE j.id = jobcard_id
        AND (auth.jwt() ->> 'tenant_id') = j.tenant_id::text
    )
  )
  WITH CHECK (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j
      WHERE j.id = jobcard_id
        AND (auth.jwt() ->> 'tenant_id') = j.tenant_id::text
    )
  );

DROP POLICY IF EXISTS dvi_items_delete ON tenant.dvi_items;
CREATE POLICY dvi_items_delete ON tenant.dvi_items FOR DELETE
  USING (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1 FROM tenant.jobcards j
      WHERE j.id = jobcard_id
        AND (auth.jwt() ->> 'tenant_id') = j.tenant_id::text
    )
  );


-- DVI photos: tenant ownership verified via dvi_items -> jobcards -> tenant_id
DROP POLICY IF EXISTS dvi_photos_select ON tenant.dvi_photos;
CREATE POLICY dvi_photos_select ON tenant.dvi_photos FOR SELECT
  USING (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1
      FROM tenant.dvi_items di
      JOIN tenant.jobcards j ON j.id = di.jobcard_id
      WHERE di.id = dvi_item_id
        AND (auth.jwt() ->> 'tenant_id') = j.tenant_id::text
    )
  );

DROP POLICY IF EXISTS dvi_photos_insert ON tenant.dvi_photos;
CREATE POLICY dvi_photos_insert ON tenant.dvi_photos FOR INSERT
  WITH CHECK (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1
      FROM tenant.dvi_items di
      JOIN tenant.jobcards j ON j.id = di.jobcard_id
      WHERE di.id = dvi_item_id
        AND (auth.jwt() ->> 'tenant_id') = j.tenant_id::text
    )
  );

DROP POLICY IF EXISTS dvi_photos_update ON tenant.dvi_photos;
CREATE POLICY dvi_photos_update ON tenant.dvi_photos FOR UPDATE
  USING (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1
      FROM tenant.dvi_items di
      JOIN tenant.jobcards j ON j.id = di.jobcard_id
      WHERE di.id = dvi_item_id
        AND (auth.jwt() ->> 'tenant_id') = j.tenant_id::text
    )
  )
  WITH CHECK (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1
      FROM tenant.dvi_items di
      JOIN tenant.jobcards j ON j.id = di.jobcard_id
      WHERE di.id = dvi_item_id
        AND (auth.jwt() ->> 'tenant_id') = j.tenant_id::text
    )
  );

DROP POLICY IF EXISTS dvi_photos_delete ON tenant.dvi_photos;
CREATE POLICY dvi_photos_delete ON tenant.dvi_photos FOR DELETE
  USING (
    (
      (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    )
    OR EXISTS (
      SELECT 1
      FROM tenant.dvi_items di
      JOIN tenant.jobcards j ON j.id = di.jobcard_id
      WHERE di.id = dvi_item_id
        AND (auth.jwt() ->> 'tenant_id') = j.tenant_id::text
    )
  );

-- 20251212_rls_option_c.sql
-- Idempotent RLS policies implementing "Option C" role model.
-- Pattern:
--   * Global bypass: service_role OR platform_admin (top-level 'role' OR app_metadata.role)
--   * Tenant-scoped access: (auth.jwt() ->> 'tenant_id') = tenant_id::text
--   * SELECT roles: tenant, admin, frontdesk, mechanic, 
--   * MUTATION roles (INSERT/UPDATE/DELETE): tenant, admin, frontdesk, 
-- Reminder: test on staging first.

-- Helper: common role lists
-- Note: We repeat these lists inline to keep policies simple and explicit.

------------------------------
-- Enable RLS (idempotent) on listed tables
------------------------------
ALTER TABLE IF EXISTS tenant.jobcards              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.estimates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.parts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.part_usages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.activities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.mechanics           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.dvi_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.dvi_checkpoints      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.dvi_checkpoint_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.settings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant.razorpay_settings    ENABLE ROW LEVEL SECURITY;

------------------------------
-- Common policy building block explanation (applies to all created policies)
-- Allow if ANY:
-- 1) top-level role is service_role or platform_admin
-- 2) app_metadata.role = 'platform_admin'
-- 3) tenant_id claim matches the row's tenant_id AND top-level/app_metadata role is in the allowed role list
------------------------------

------------------------------
-- Policies for tenant.jobcards
------------------------------
DROP POLICY IF EXISTS jobcards_select ON tenant.jobcards;
CREATE POLICY jobcards_select ON tenant.jobcards FOR SELECT
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

DROP POLICY IF EXISTS jobcards_insert ON tenant.jobcards;
CREATE POLICY jobcards_insert ON tenant.jobcards FOR INSERT
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

DROP POLICY IF EXISTS jobcards_update ON tenant.jobcards;
CREATE POLICY jobcards_update ON tenant.jobcards FOR UPDATE
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

DROP POLICY IF EXISTS jobcards_delete ON tenant.jobcards;
CREATE POLICY jobcards_delete ON tenant.jobcards FOR DELETE
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

------------------------------
-- Policies for tenant.estimates
------------------------------
DROP POLICY IF EXISTS estimates_select ON tenant.estimates;
CREATE POLICY estimates_select ON tenant.estimates FOR SELECT
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

DROP POLICY IF EXISTS estimates_insert ON tenant.estimates;
CREATE POLICY estimates_insert ON tenant.estimates FOR INSERT
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

DROP POLICY IF EXISTS estimates_update ON tenant.estimates;
CREATE POLICY estimates_update ON tenant.estimates FOR UPDATE
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

DROP POLICY IF EXISTS estimates_delete ON tenant.estimates;
CREATE POLICY estimates_delete ON tenant.estimates FOR DELETE
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

------------------------------
-- Policies for tenant.invoices
------------------------------
DROP POLICY IF EXISTS invoices_select ON tenant.invoices;
CREATE POLICY invoices_select ON tenant.invoices FOR SELECT
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

DROP POLICY IF EXISTS invoices_insert ON tenant.invoices;
CREATE POLICY invoices_insert ON tenant.invoices FOR INSERT
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

DROP POLICY IF EXISTS invoices_update ON tenant.invoices;
CREATE POLICY invoices_update ON tenant.invoices FOR UPDATE
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

DROP POLICY IF EXISTS invoices_delete ON tenant.invoices;
CREATE POLICY invoices_delete ON tenant.invoices FOR DELETE
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

------------------------------
-- Policies for tenant.payments
------------------------------
DROP POLICY IF EXISTS payments_select ON tenant.payments;
CREATE POLICY payments_select ON tenant.payments FOR SELECT
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

DROP POLICY IF EXISTS payments_insert ON tenant.payments;
CREATE POLICY payments_insert ON tenant.payments FOR INSERT
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

DROP POLICY IF EXISTS payments_update ON tenant.payments;
CREATE POLICY payments_update ON tenant.payments FOR UPDATE
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

DROP POLICY IF EXISTS payments_delete ON tenant.payments;
CREATE POLICY payments_delete ON tenant.payments FOR DELETE
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

------------------------------
-- Policies for tenant.payment_transactions
------------------------------
DROP POLICY IF EXISTS payment_transactions_select ON tenant.payment_transactions;
CREATE POLICY payment_transactions_select ON tenant.payment_transactions FOR SELECT
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

DROP POLICY IF EXISTS payment_transactions_insert ON tenant.payment_transactions;
CREATE POLICY payment_transactions_insert ON tenant.payment_transactions FOR INSERT
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

DROP POLICY IF EXISTS payment_transactions_update ON tenant.payment_transactions;
CREATE POLICY payment_transactions_update ON tenant.payment_transactions FOR UPDATE
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

DROP POLICY IF EXISTS payment_transactions_delete ON tenant.payment_transactions;
CREATE POLICY payment_transactions_delete ON tenant.payment_transactions FOR DELETE
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

------------------------------
-- Policies for tenant.parts
------------------------------
DROP POLICY IF EXISTS parts_select ON tenant.parts;
CREATE POLICY parts_select ON tenant.parts FOR SELECT
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

DROP POLICY IF EXISTS parts_insert ON tenant.parts;
CREATE POLICY parts_insert ON tenant.parts FOR INSERT
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

DROP POLICY IF EXISTS parts_update ON tenant.parts;
CREATE POLICY parts_update ON tenant.parts FOR UPDATE
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

DROP POLICY IF EXISTS parts_delete ON tenant.parts;
CREATE POLICY parts_delete ON tenant.parts FOR DELETE
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

------------------------------
-- Policies for tenant.part_usages
------------------------------
DROP POLICY IF EXISTS part_usages_select ON tenant.part_usages;
CREATE POLICY part_usages_select ON tenant.part_usages FOR SELECT
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

DROP POLICY IF EXISTS part_usages_insert ON tenant.part_usages;
CREATE POLICY part_usages_insert ON tenant.part_usages FOR INSERT
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

DROP POLICY IF EXISTS part_usages_update ON tenant.part_usages;
CREATE POLICY part_usages_update ON tenant.part_usages FOR UPDATE
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

DROP POLICY IF EXISTS part_usages_delete ON tenant.part_usages;
CREATE POLICY part_usages_delete ON tenant.part_usages FOR DELETE
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

------------------------------
-- Policies for tenant.inventory_transactions
------------------------------
DROP POLICY IF EXISTS inventory_transactions_select ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_select ON tenant.inventory_transactions FOR SELECT
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

DROP POLICY IF EXISTS inventory_transactions_insert ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_insert ON tenant.inventory_transactions FOR INSERT
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

DROP POLICY IF EXISTS inventory_transactions_update ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_update ON tenant.inventory_transactions FOR UPDATE
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

DROP POLICY IF EXISTS inventory_transactions_delete ON tenant.inventory_transactions;
CREATE POLICY inventory_transactions_delete ON tenant.inventory_transactions FOR DELETE
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

------------------------------
-- Policies for tenant.notifications
------------------------------
DROP POLICY IF EXISTS notifications_select ON tenant.notifications;
CREATE POLICY notifications_select ON tenant.notifications FOR SELECT
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

DROP POLICY IF EXISTS notifications_insert ON tenant.notifications;
CREATE POLICY notifications_insert ON tenant.notifications FOR INSERT
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

DROP POLICY IF EXISTS notifications_update ON tenant.notifications;
CREATE POLICY notifications_update ON tenant.notifications FOR UPDATE
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

DROP POLICY IF EXISTS notifications_delete ON tenant.notifications;
CREATE POLICY notifications_delete ON tenant.notifications FOR DELETE
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

------------------------------
-- Policies for tenant.activities
------------------------------
DROP POLICY IF EXISTS activities_select ON tenant.activities;
CREATE POLICY activities_select ON tenant.activities FOR SELECT
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

DROP POLICY IF EXISTS activities_insert ON tenant.activities;
CREATE POLICY activities_insert ON tenant.activities FOR INSERT
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

DROP POLICY IF EXISTS activities_update ON tenant.activities;
CREATE POLICY activities_update ON tenant.activities FOR UPDATE
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

DROP POLICY IF EXISTS activities_delete ON tenant.activities;
CREATE POLICY activities_delete ON tenant.activities FOR DELETE
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

------------------------------
-- Policies for tenant.mechanics
------------------------------
DROP POLICY IF EXISTS mechanics_select ON tenant.mechanics;
CREATE POLICY mechanics_select ON tenant.mechanics FOR SELECT
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
        (auth.jwt() ->> 'role') IN ('tenant','admin','frontdesk')
        OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('tenant','admin','frontdesk')
      )
    )
  );

------------------------------
-- Policies for tenant.dvi_templates
------------------------------
DROP POLICY IF EXISTS dvi_templates_select ON tenant.dvi_templates;
CREATE POLICY dvi_templates_select ON tenant.dvi_templates FOR SELECT
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

DROP POLICY IF EXISTS dvi_templates_insert ON tenant.dvi_templates;
CREATE POLICY dvi_templates_insert ON tenant.dvi_templates FOR INSERT
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

DROP POLICY IF EXISTS dvi_templates_update ON tenant.dvi_templates;
CREATE POLICY dvi_templates_update ON tenant.dvi_templates FOR UPDATE
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

DROP POLICY IF EXISTS dvi_templates_delete ON tenant.dvi_templates;
CREATE POLICY dvi_templates_delete ON tenant.dvi_templates FOR DELETE
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

------------------------------
-- Policies for tenant.dvi_checkpoints
------------------------------
DROP POLICY IF EXISTS dvi_checkpoints_select ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_select ON tenant.dvi_checkpoints FOR SELECT
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

DROP POLICY IF EXISTS dvi_checkpoints_insert ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_insert ON tenant.dvi_checkpoints FOR INSERT
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

DROP POLICY IF EXISTS dvi_checkpoints_update ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_update ON tenant.dvi_checkpoints FOR UPDATE
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

DROP POLICY IF EXISTS dvi_checkpoints_delete ON tenant.dvi_checkpoints;
CREATE POLICY dvi_checkpoints_delete ON tenant.dvi_checkpoints FOR DELETE
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

------------------------------
-- Policies for tenant.dvi_checkpoint_categories
------------------------------
DROP POLICY IF EXISTS dvi_checkpoint_categories_select ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_select ON tenant.dvi_checkpoint_categories FOR SELECT
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

DROP POLICY IF EXISTS dvi_checkpoint_categories_insert ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_insert ON tenant.dvi_checkpoint_categories FOR INSERT
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

DROP POLICY IF EXISTS dvi_checkpoint_categories_update ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_update ON tenant.dvi_checkpoint_categories FOR UPDATE
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

DROP POLICY IF EXISTS dvi_checkpoint_categories_delete ON tenant.dvi_checkpoint_categories;
CREATE POLICY dvi_checkpoint_categories_delete ON tenant.dvi_checkpoint_categories FOR DELETE
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

------------------------------
-- Policies for tenant.settings
------------------------------
DROP POLICY IF EXISTS settings_select ON tenant.settings;
CREATE POLICY settings_select ON tenant.settings FOR SELECT
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

DROP POLICY IF EXISTS settings_insert ON tenant.settings;
CREATE POLICY settings_insert ON tenant.settings FOR INSERT
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

DROP POLICY IF EXISTS settings_update ON tenant.settings;
CREATE POLICY settings_update ON tenant.settings FOR UPDATE
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

DROP POLICY IF EXISTS settings_delete ON tenant.settings;
CREATE POLICY settings_delete ON tenant.settings FOR DELETE
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

------------------------------
-- Policies for tenant.razorpay_settings
------------------------------
DROP POLICY IF EXISTS razorpay_settings_select ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_select ON tenant.razorpay_settings FOR SELECT
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

DROP POLICY IF EXISTS razorpay_settings_insert ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_insert ON tenant.razorpay_settings FOR INSERT
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

DROP POLICY IF EXISTS razorpay_settings_update ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_update ON tenant.razorpay_settings FOR UPDATE
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

DROP POLICY IF EXISTS razorpay_settings_delete ON tenant.razorpay_settings;
CREATE POLICY razorpay_settings_delete ON tenant.razorpay_settings FOR DELETE
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


