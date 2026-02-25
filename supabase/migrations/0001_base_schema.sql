-- =============================================================================
-- 0001_base_schema.sql
-- Pure structure: Extensions, Schemas, Enums, Tables, Foreign Keys, Indexes, Triggers
-- NO RLS, NO Policies, NO Grants, NO auth.jwt()
-- =============================================================================

-- SESSION & ENV
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- SCHEMAS
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS tenant;

-- =============================================================================
-- ENUMS
-- =============================================================================

-- tenant.roles - All possible user roles within a tenant
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'roles' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname='tenant')) THEN
    CREATE TYPE tenant.roles AS ENUM (
      'tenant',
      'tenant_owner',
      'tenant_admin',
      'admin',
      'manager',
      'frontdesk',
      'mechanic',
      'employee'
    );
  END IF;
END$$;

-- public.platform_admin_role - Platform admin roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_admin_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname='public')) THEN
    CREATE TYPE public.platform_admin_role AS ENUM ('platform_admin', 'employee');
  END IF;
END$$;

-- tenant.tenant_status - Tenant operational status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname='tenant')) THEN
    CREATE TYPE tenant.tenant_status AS ENUM ('active', 'suspended', 'trial', 'inactive');
  END IF;
END$$;

-- tenant.subscription_tier - Subscription tiers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname='tenant')) THEN
    CREATE TYPE tenant.subscription_tier AS ENUM ('basic', 'pro', 'enterprise');
  END IF;
END$$;

-- tenant.payment_method_enum - Payment methods
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname='tenant')) THEN
    CREATE TYPE tenant.payment_method_enum AS ENUM (
      'cash',
      'card',
      'upi',
      'bank_transfer',
      'cheque'
    );
  END IF;
END$$;

-- =============================================================================
-- TRIGGER FUNCTION: updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PUBLIC TABLES
-- =============================================================================

-- Platform Admins
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

-- Vehicle Category (global reference data)
CREATE TABLE IF NOT EXISTS public.vehicle_category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text
);

-- Vehicle Make (global reference data)
CREATE TABLE IF NOT EXISTS public.vehicle_make (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  created_at timestamptz DEFAULT now()
);

-- Vehicle Model (global reference data)
CREATE TABLE IF NOT EXISTS public.vehicle_model (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make_id uuid NOT NULL,
  name text NOT NULL,
  model_code text,
  vehicle_category uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT vehicle_model_make_id_name_key UNIQUE (make_id, name)
);

-- Leads (demo requests - public schema) 
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  garage_name text,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  source text DEFAULT 'website',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

COMMENT ON TABLE public.leads IS 'Leads from demo request forms - only accessible by service_role and platform_admins';

-- =============================================================================
-- TENANT TABLES
-- =============================================================================

-- Tenants
CREATE TABLE IF NOT EXISTS tenant.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  status tenant.tenant_status DEFAULT 'active' NOT NULL,
  subscription tenant.subscription_tier DEFAULT 'basic' NOT NULL,
  subscription_status text DEFAULT 'trial',
  is_onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Users
CREATE TABLE IF NOT EXISTS tenant.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  auth_user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  role tenant.roles NOT NULL DEFAULT 'tenant'::tenant.roles,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Customers
CREATE TABLE IF NOT EXISTS tenant.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Vehicles
CREATE TABLE IF NOT EXISTS tenant.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  reg_no text NOT NULL,
  vin text,
  make_id uuid,
  model_id uuid,
  make text,
  model text,
  color text,
  license_plate text,
  year smallint,
  odometer integer,
  mileage integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Mechanics
CREATE TABLE IF NOT EXISTS tenant.mechanics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  skills text[],
  hourly_rate numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Job Cards
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
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Parts
CREATE TABLE IF NOT EXISTS tenant.parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  stock_keeping_unit text,
  name text NOT NULL,
  unit_cost numeric(12,2) DEFAULT 0,
  sell_price numeric(12,2) DEFAULT 0,
  stock_on_hand integer DEFAULT 0,
  reorder_level integer DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Part Usages
CREATE TABLE IF NOT EXISTS tenant.part_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  jobcard_id uuid NOT NULL,
  part_id uuid NOT NULL,
  qty integer NOT NULL,
  unit_price numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Estimates
CREATE TABLE IF NOT EXISTS tenant.estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  estimate_number text DEFAULT ''::text NOT NULL,
  jobcard_id uuid,
  customer_id uuid,
  vehicle_id uuid,
  created_by uuid,
  status text NOT NULL DEFAULT 'draft',
  description text,
  total_amount numeric(12,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  labor_total numeric(10,2) DEFAULT 0,
  parts_total numeric(10,2) DEFAULT 0,
  subtotal numeric(12,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'INR',
  items jsonb DEFAULT '[]'::jsonb,
  valid_until timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Estimate Items
CREATE TABLE IF NOT EXISTS tenant.estimate_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
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

-- Invoices
CREATE TABLE IF NOT EXISTS tenant.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_number text,
  jobcard_id uuid,
  estimate_id uuid,
  customer_id uuid,
  created_by uuid,
  status text NOT NULL DEFAULT 'pending',
  subtotal numeric(12,2) DEFAULT 0,
  tax numeric(12,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(12,2) DEFAULT 0,
  paid_amount numeric(10,2) DEFAULT 0,
  balance numeric(12,2) DEFAULT 0,
  due_date date,
  invoice_date timestamptz NOT NULL DEFAULT now(),
  issued_at timestamptz NOT NULL DEFAULT now(),
  payment_mode text,
  file_key text,
  filename text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Payments
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
  payment_method tenant.payment_method_enum NOT NULL DEFAULT 'cash'::tenant.payment_method_enum,
  reference_number text,
  received_by uuid
);

-- Payment Transactions
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

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS tenant.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  part_id uuid NOT NULL,
  transaction_type text NOT NULL,
  quantity integer NOT NULL,
  unit_cost numeric(10,2),
  reference_type text,
  reference_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS tenant.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid,
  jobcard_id uuid,
  user_id uuid,
  channel text NOT NULL,
  template text,
  payload jsonb,
  status text NOT NULL DEFAULT 'queued',
  category text,
  entity_type text,
  entity_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activities
CREATE TABLE IF NOT EXISTS tenant.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  jobcard_id uuid,
  user_id uuid,
  activity_type text NOT NULL,
  description text NOT NULL,
  entity_type text,
  entity_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- DVI Templates
CREATE TABLE IF NOT EXISTS tenant.dvi_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- DVI Checkpoint Categories
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

-- DVI Checkpoints
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

-- DVI Items
CREATE TABLE IF NOT EXISTS tenant.dvi_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jobcard_id uuid NOT NULL,
  checkpoint_id uuid NOT NULL,
  checkpoint_name text,
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- DVI Photos
CREATE TABLE IF NOT EXISTS tenant.dvi_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dvi_item_id uuid NOT NULL,
  storage_path text NOT NULL,
  url text NOT NULL,
  caption text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Settings (includes business profile and branding)
CREATE TABLE IF NOT EXISTS tenant.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE,
  -- Business Profile
  legal_name text,
  gst_number text,
  pan_number text,
  address text,
  city text,
  state text,
  pincode text,
  business_phone text,
  business_email text,
  website text,
  -- Operational Settings
  tax_rate numeric(5,2) DEFAULT 0,
  currency text DEFAULT 'INR',
  timezone text DEFAULT 'Asia/Kolkata',
  -- Notification Preferences
  sms_enabled boolean DEFAULT false,
  email_enabled boolean DEFAULT false,
  whatsapp_enabled boolean DEFAULT false,
  -- Document Prefixes
  invoice_prefix text DEFAULT 'INV-',
  job_prefix text DEFAULT 'JOB-',
  estimate_prefix text DEFAULT 'EST-',
  invoice_footer text,
  -- Branding (S3 storage paths)
  logo_url text,
  logo_storage_path text,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Razorpay Settings
CREATE TABLE IF NOT EXISTS tenant.razorpay_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE,
  key_id text NOT NULL,
  key_secret text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Counters (for sequential numbering)
CREATE TABLE IF NOT EXISTS tenant.counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  counter_key text NOT NULL,
  prefix text NOT NULL,
  current_value integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT counters_unique_per_tenant UNIQUE (tenant_id, counter_key)
);

-- Monthly Analytics
CREATE TABLE IF NOT EXISTS tenant.monthly_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  total_jobs integer NOT NULL DEFAULT 0,
  total_invoices integer NOT NULL DEFAULT 0,
  total_revenue numeric(14,2) NOT NULL DEFAULT 0,
  paid_revenue numeric(14,2) NOT NULL DEFAULT 0,
  outstanding_revenue numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monthly_analytics_unique UNIQUE (tenant_id, year, month)
);

-- =============================================================================
-- FOREIGN KEYS
-- =============================================================================

-- Public schema FKs
ALTER TABLE public.vehicle_model DROP CONSTRAINT IF EXISTS vehicle_model_make_id_fkey;
ALTER TABLE public.vehicle_model ADD CONSTRAINT vehicle_model_make_id_fkey 
  FOREIGN KEY (make_id) REFERENCES public.vehicle_make(id);

ALTER TABLE public.vehicle_model DROP CONSTRAINT IF EXISTS vehicle_model_vehicle_category_fkey;
ALTER TABLE public.vehicle_model ADD CONSTRAINT vehicle_model_vehicle_category_fkey 
  FOREIGN KEY (vehicle_category) REFERENCES public.vehicle_category(id);

-- Tenant schema FKs
ALTER TABLE tenant.users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;
ALTER TABLE tenant.users ADD CONSTRAINT users_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.users DROP CONSTRAINT IF EXISTS users_auth_user_id_fkey;
ALTER TABLE tenant.users ADD CONSTRAINT users_auth_user_id_fkey 
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE tenant.customers DROP CONSTRAINT IF EXISTS customers_tenant_id_fkey;
ALTER TABLE tenant.customers ADD CONSTRAINT customers_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.vehicles DROP CONSTRAINT IF EXISTS vehicles_tenant_id_fkey;
ALTER TABLE tenant.vehicles ADD CONSTRAINT vehicles_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.vehicles DROP CONSTRAINT IF EXISTS vehicles_customer_id_fkey;
ALTER TABLE tenant.vehicles ADD CONSTRAINT vehicles_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES tenant.customers(id) ON DELETE RESTRICT;

ALTER TABLE tenant.vehicles DROP CONSTRAINT IF EXISTS vehicles_make_id_fkey;
ALTER TABLE tenant.vehicles ADD CONSTRAINT vehicles_make_id_fkey 
  FOREIGN KEY (make_id) REFERENCES public.vehicle_make(id);

ALTER TABLE tenant.vehicles DROP CONSTRAINT IF EXISTS vehicles_model_id_fkey;
ALTER TABLE tenant.vehicles ADD CONSTRAINT vehicles_model_id_fkey 
  FOREIGN KEY (model_id) REFERENCES public.vehicle_model(id);

ALTER TABLE tenant.mechanics DROP CONSTRAINT IF EXISTS mechanics_tenant_id_fkey;
ALTER TABLE tenant.mechanics ADD CONSTRAINT mechanics_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.jobcards DROP CONSTRAINT IF EXISTS jobcards_tenant_id_fkey;
ALTER TABLE tenant.jobcards ADD CONSTRAINT jobcards_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.jobcards DROP CONSTRAINT IF EXISTS jobcards_customer_id_fkey;
ALTER TABLE tenant.jobcards ADD CONSTRAINT jobcards_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES tenant.customers(id) ON DELETE RESTRICT;

ALTER TABLE tenant.jobcards DROP CONSTRAINT IF EXISTS jobcards_vehicle_id_fkey;
ALTER TABLE tenant.jobcards ADD CONSTRAINT jobcards_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) REFERENCES tenant.vehicles(id) ON DELETE RESTRICT;

ALTER TABLE tenant.jobcards DROP CONSTRAINT IF EXISTS jobcards_assigned_mechanic_id_fkey;
ALTER TABLE tenant.jobcards ADD CONSTRAINT jobcards_assigned_mechanic_id_fkey 
  FOREIGN KEY (assigned_mechanic_id) REFERENCES tenant.mechanics(id) ON DELETE SET NULL;

ALTER TABLE tenant.parts DROP CONSTRAINT IF EXISTS parts_tenant_id_fkey;
ALTER TABLE tenant.parts ADD CONSTRAINT parts_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.part_usages DROP CONSTRAINT IF EXISTS part_usages_tenant_id_fkey;
ALTER TABLE tenant.part_usages ADD CONSTRAINT part_usages_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.part_usages DROP CONSTRAINT IF EXISTS part_usages_jobcard_id_fkey;
ALTER TABLE tenant.part_usages ADD CONSTRAINT part_usages_jobcard_id_fkey 
  FOREIGN KEY (jobcard_id) REFERENCES tenant.jobcards(id) ON DELETE CASCADE;

ALTER TABLE tenant.part_usages DROP CONSTRAINT IF EXISTS part_usages_part_id_fkey;
ALTER TABLE tenant.part_usages ADD CONSTRAINT part_usages_part_id_fkey 
  FOREIGN KEY (part_id) REFERENCES tenant.parts(id) ON DELETE RESTRICT;

ALTER TABLE tenant.estimates DROP CONSTRAINT IF EXISTS estimates_tenant_id_fkey;
ALTER TABLE tenant.estimates ADD CONSTRAINT estimates_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.estimates DROP CONSTRAINT IF EXISTS estimates_jobcard_id_fkey;
ALTER TABLE tenant.estimates ADD CONSTRAINT estimates_jobcard_id_fkey 
  FOREIGN KEY (jobcard_id) REFERENCES tenant.jobcards(id) ON DELETE SET NULL;

ALTER TABLE tenant.estimates DROP CONSTRAINT IF EXISTS estimates_customer_id_fkey;
ALTER TABLE tenant.estimates ADD CONSTRAINT estimates_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES tenant.customers(id) ON DELETE SET NULL;

ALTER TABLE tenant.estimates DROP CONSTRAINT IF EXISTS estimates_vehicle_id_fkey;
ALTER TABLE tenant.estimates ADD CONSTRAINT estimates_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) REFERENCES tenant.vehicles(id) ON DELETE SET NULL;

ALTER TABLE tenant.estimate_items DROP CONSTRAINT IF EXISTS estimate_items_tenant_id_fkey;
ALTER TABLE tenant.estimate_items ADD CONSTRAINT estimate_items_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.estimate_items DROP CONSTRAINT IF EXISTS estimate_items_estimate_id_fkey;
ALTER TABLE tenant.estimate_items ADD CONSTRAINT estimate_items_estimate_id_fkey 
  FOREIGN KEY (estimate_id) REFERENCES tenant.estimates(id) ON DELETE CASCADE;

ALTER TABLE tenant.estimate_items DROP CONSTRAINT IF EXISTS estimate_items_part_id_fkey;
ALTER TABLE tenant.estimate_items ADD CONSTRAINT estimate_items_part_id_fkey 
  FOREIGN KEY (part_id) REFERENCES tenant.parts(id) ON DELETE SET NULL;

ALTER TABLE tenant.invoices DROP CONSTRAINT IF EXISTS invoices_tenant_id_fkey;
ALTER TABLE tenant.invoices ADD CONSTRAINT invoices_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.invoices DROP CONSTRAINT IF EXISTS invoices_jobcard_id_fkey;
ALTER TABLE tenant.invoices ADD CONSTRAINT invoices_jobcard_id_fkey 
  FOREIGN KEY (jobcard_id) REFERENCES tenant.jobcards(id) ON DELETE SET NULL;

ALTER TABLE tenant.invoices DROP CONSTRAINT IF EXISTS invoices_estimate_id_fkey;
ALTER TABLE tenant.invoices ADD CONSTRAINT invoices_estimate_id_fkey 
  FOREIGN KEY (estimate_id) REFERENCES tenant.estimates(id) ON DELETE SET NULL;

ALTER TABLE tenant.invoices DROP CONSTRAINT IF EXISTS invoices_customer_id_fkey;
ALTER TABLE tenant.invoices ADD CONSTRAINT invoices_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES tenant.customers(id) ON DELETE SET NULL;

ALTER TABLE tenant.payments DROP CONSTRAINT IF EXISTS payments_tenant_id_fkey;
ALTER TABLE tenant.payments ADD CONSTRAINT payments_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.payments DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey;
ALTER TABLE tenant.payments ADD CONSTRAINT payments_invoice_id_fkey 
  FOREIGN KEY (invoice_id) REFERENCES tenant.invoices(id) ON DELETE CASCADE;

ALTER TABLE tenant.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_tenant_id_fkey;
ALTER TABLE tenant.payment_transactions ADD CONSTRAINT payment_transactions_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_invoice_id_fkey;
ALTER TABLE tenant.payment_transactions ADD CONSTRAINT payment_transactions_invoice_id_fkey 
  FOREIGN KEY (invoice_id) REFERENCES tenant.invoices(id) ON DELETE CASCADE;

ALTER TABLE tenant.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_tenant_id_fkey;
ALTER TABLE tenant.inventory_transactions ADD CONSTRAINT inventory_transactions_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_part_id_fkey;
ALTER TABLE tenant.inventory_transactions ADD CONSTRAINT inventory_transactions_part_id_fkey 
  FOREIGN KEY (part_id) REFERENCES tenant.parts(id) ON DELETE CASCADE;

ALTER TABLE tenant.notifications DROP CONSTRAINT IF EXISTS notifications_tenant_id_fkey;
ALTER TABLE tenant.notifications ADD CONSTRAINT notifications_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.activities DROP CONSTRAINT IF EXISTS activities_tenant_id_fkey;
ALTER TABLE tenant.activities ADD CONSTRAINT activities_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.dvi_templates DROP CONSTRAINT IF EXISTS dvi_templates_tenant_id_fkey;
ALTER TABLE tenant.dvi_templates ADD CONSTRAINT dvi_templates_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.dvi_checkpoint_categories DROP CONSTRAINT IF EXISTS dvi_checkpoint_categories_tenant_id_fkey;
ALTER TABLE tenant.dvi_checkpoint_categories ADD CONSTRAINT dvi_checkpoint_categories_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.dvi_checkpoints DROP CONSTRAINT IF EXISTS dvi_checkpoints_tenant_id_fkey;
ALTER TABLE tenant.dvi_checkpoints ADD CONSTRAINT dvi_checkpoints_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.dvi_checkpoints DROP CONSTRAINT IF EXISTS dvi_checkpoints_template_id_fkey;
ALTER TABLE tenant.dvi_checkpoints ADD CONSTRAINT dvi_checkpoints_template_id_fkey 
  FOREIGN KEY (template_id) REFERENCES tenant.dvi_templates(id) ON DELETE SET NULL;

ALTER TABLE tenant.dvi_checkpoints DROP CONSTRAINT IF EXISTS dvi_checkpoints_category_id_fkey;
ALTER TABLE tenant.dvi_checkpoints ADD CONSTRAINT dvi_checkpoints_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES tenant.dvi_checkpoint_categories(id) ON DELETE SET NULL;

ALTER TABLE tenant.dvi_items DROP CONSTRAINT IF EXISTS dvi_items_jobcard_id_fkey;
ALTER TABLE tenant.dvi_items ADD CONSTRAINT dvi_items_jobcard_id_fkey 
  FOREIGN KEY (jobcard_id) REFERENCES tenant.jobcards(id) ON DELETE CASCADE;

ALTER TABLE tenant.dvi_items DROP CONSTRAINT IF EXISTS dvi_items_checkpoint_id_fkey;
ALTER TABLE tenant.dvi_items ADD CONSTRAINT dvi_items_checkpoint_id_fkey 
  FOREIGN KEY (checkpoint_id) REFERENCES tenant.dvi_checkpoints(id) ON DELETE CASCADE;

ALTER TABLE tenant.dvi_photos DROP CONSTRAINT IF EXISTS dvi_photos_dvi_item_id_fkey;
ALTER TABLE tenant.dvi_photos ADD CONSTRAINT dvi_photos_dvi_item_id_fkey 
  FOREIGN KEY (dvi_item_id) REFERENCES tenant.dvi_items(id) ON DELETE CASCADE;

ALTER TABLE tenant.settings DROP CONSTRAINT IF EXISTS settings_tenant_id_fkey;
ALTER TABLE tenant.settings ADD CONSTRAINT settings_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.razorpay_settings DROP CONSTRAINT IF EXISTS razorpay_settings_tenant_id_fkey;
ALTER TABLE tenant.razorpay_settings ADD CONSTRAINT razorpay_settings_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.counters DROP CONSTRAINT IF EXISTS counters_tenant_fkey;
ALTER TABLE tenant.counters ADD CONSTRAINT counters_tenant_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant.monthly_analytics DROP CONSTRAINT IF EXISTS monthly_analytics_tenant_fkey;
ALTER TABLE tenant.monthly_analytics ADD CONSTRAINT monthly_analytics_tenant_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Tenant isolation indexes (critical for RLS performance)
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON tenant.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON tenant.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON tenant.vehicles(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_tenant_id_reg_no_key ON tenant.vehicles(tenant_id, reg_no);
CREATE INDEX IF NOT EXISTS idx_jobcards_tenant_id ON tenant.jobcards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON tenant.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_estimates_tenant_id ON tenant.estimates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parts_tenant_id ON tenant.parts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mechanics_tenant_id ON tenant.mechanics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobcards_assigned_mechanic_id ON tenant.jobcards(assigned_mechanic_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON tenant.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_part_usages_jobcard_id ON tenant.part_usages(jobcard_id);
CREATE INDEX IF NOT EXISTS idx_part_usages_part_id ON tenant.part_usages(part_id);
CREATE INDEX IF NOT EXISTS idx_estimates_jobcard_id ON tenant.estimates(jobcard_id);
CREATE INDEX IF NOT EXISTS idx_estimates_customer_id ON tenant.estimates(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_jobcard_id ON tenant.invoices(jobcard_id);
CREATE INDEX IF NOT EXISTS idx_invoices_estimate_id ON tenant.invoices(estimate_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON tenant.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_estimate_items_tenant_id ON tenant.estimate_items(tenant_id);

-- Status indexes
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenant.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription ON tenant.tenants(subscription);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenant.tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON tenant.invoices(tenant_id, status);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_tenant_date ON tenant.payments(tenant_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_method ON tenant.payments(tenant_id, payment_method);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- =============================================================================
-- TRIGGERS (updated_at only - no security logic)
-- =============================================================================

DROP TRIGGER IF EXISTS trg_platform_admins_updated_at ON public.platform_admins;
CREATE TRIGGER trg_platform_admins_updated_at
  BEFORE UPDATE ON public.platform_admins
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamps();

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- End of 0001_base_schema.sql
