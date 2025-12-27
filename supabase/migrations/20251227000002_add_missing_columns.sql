-- Add soft delete columns to tenant tables
-- This fixes "column deleted_at does not exist" errors

ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS deleted_by uuid;

ALTER TABLE tenant.customers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tenant.customers ADD COLUMN IF NOT EXISTS deleted_by uuid;

ALTER TABLE tenant.vehicles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tenant.vehicles ADD COLUMN IF NOT EXISTS deleted_by uuid;
-- Also add missing columns expected by UI
ALTER TABLE tenant.vehicles ADD COLUMN IF NOT EXISTS make text;
ALTER TABLE tenant.vehicles ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE tenant.vehicles ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE tenant.vehicles ADD COLUMN IF NOT EXISTS license_plate text;
ALTER TABLE tenant.vehicles ADD COLUMN IF NOT EXISTS mileage integer;
ALTER TABLE tenant.vehicles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE tenant.mechanics ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tenant.mechanics ADD COLUMN IF NOT EXISTS deleted_by uuid;

ALTER TABLE tenant.jobcards ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tenant.jobcards ADD COLUMN IF NOT EXISTS deleted_by uuid;
-- Add started_at and completed_at if missing
ALTER TABLE tenant.jobcards ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE tenant.jobcards ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE tenant.parts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tenant.parts ADD COLUMN IF NOT EXISTS deleted_by uuid;

ALTER TABLE tenant.estimates ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tenant.estimates ADD COLUMN IF NOT EXISTS deleted_by uuid;

ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS deleted_by uuid;
