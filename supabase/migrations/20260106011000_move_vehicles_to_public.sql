-- Move vehicles to public schema with tenant-aware columns and text make/model
-- Also rewire jobcards.vehicle_id to reference the new public.vehicles table
-- Keeps vehicle data accessible across tenants (no RLS) and drops make_id/model_id indirection.

-- 1) Create public.vehicles with text make/model and extra attributes
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  reg_no text NOT NULL,
  vin text,
  make text,
  model text,
  year smallint,
  odometer integer,
  mileage integer,
  color text,
  license_plate text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Ensure the table is readable (no RLS on public schema tables by default)
ALTER TABLE IF EXISTS public.vehicles DISABLE ROW LEVEL SECURITY;

-- 2) Copy existing tenant.vehicles data if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'tenant' AND table_name = 'vehicles'
  ) THEN
    INSERT INTO public.vehicles (id, tenant_id, customer_id, reg_no, vin, make, model, year, odometer, mileage, color, license_plate, notes, created_at, updated_at, deleted_at, deleted_by)
    SELECT 
      id,
      tenant_id,
      customer_id,
      reg_no,
      vin,
      COALESCE(make, ''),
      COALESCE(model, ''),
      year,
      odometer,
      NULLIF(mileage, 0),
      color,
      COALESCE(license_plate, reg_no),
      notes,
      created_at,
      COALESCE(updated_at, created_at),
      deleted_at,
      deleted_by
    FROM tenant.vehicles
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 3) Re-point jobcards.vehicle_id to public.vehicles
ALTER TABLE IF EXISTS tenant.jobcards DROP CONSTRAINT IF EXISTS jobcards_vehicle_id_fkey;
ALTER TABLE IF EXISTS tenant.jobcards
  ADD CONSTRAINT jobcards_vehicle_id_fkey
  FOREIGN KEY (vehicle_id)
  REFERENCES public.vehicles(id)
  ON DELETE RESTRICT;

-- 3b) Re-point estimates.vehicle_id to public.vehicles
ALTER TABLE IF EXISTS tenant.estimates DROP CONSTRAINT IF EXISTS estimates_vehicle_id_fkey;
ALTER TABLE IF EXISTS tenant.estimates
  ADD CONSTRAINT estimates_vehicle_id_fkey
  FOREIGN KEY (vehicle_id)
  REFERENCES public.vehicles(id)
  ON DELETE RESTRICT;

-- 4) Drop tenant.vehicles (keep for rollback safety if needed)
DROP TABLE IF EXISTS tenant.vehicles;
