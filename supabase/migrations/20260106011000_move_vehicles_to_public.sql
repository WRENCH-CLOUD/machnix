-- REVERT MIGRATION: Keep vehicles in tenant schema (do NOT move to public)
-- NOTE: The filename '20260106011000_move_vehicles_to_public.sql' is legacy
-- and does not reflect the current behavior; this migration enforces the
-- correct design: tenant.vehicles with text make/model columns and
-- FK references to public.vehicle_make/model for lookup

-- 1) If public.vehicles was created by accident, drop it
DROP TABLE IF EXISTS public.vehicles;

-- 2) Ensure tenant.vehicles exists with proper schema
-- Add text-based make/model columns if missing (for direct storage)
ALTER TABLE IF EXISTS tenant.vehicles ADD COLUMN IF NOT EXISTS make text;
ALTER TABLE IF EXISTS tenant.vehicles ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE IF EXISTS tenant.vehicles ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE IF EXISTS tenant.vehicles ADD COLUMN IF NOT EXISTS license_plate text;
ALTER TABLE IF EXISTS tenant.vehicles ADD COLUMN IF NOT EXISTS mileage integer;
ALTER TABLE IF EXISTS tenant.vehicles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS tenant.vehicles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE IF EXISTS tenant.vehicles ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- 3) Ensure jobcards.vehicle_id FK points to tenant.vehicles
ALTER TABLE IF EXISTS tenant.jobcards DROP CONSTRAINT IF EXISTS jobcards_vehicle_id_fkey;
ALTER TABLE IF EXISTS tenant.jobcards
  ADD CONSTRAINT jobcards_vehicle_id_fkey
  FOREIGN KEY (vehicle_id)
  REFERENCES tenant.vehicles(id)
  ON DELETE RESTRICT;

-- 4) Ensure estimates.vehicle_id FK points to tenant.vehicles (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'tenant' 
      AND table_name = 'estimates' 
      AND column_name = 'vehicle_id'
  ) THEN
    EXECUTE 'ALTER TABLE IF EXISTS tenant.estimates DROP CONSTRAINT IF EXISTS estimates_vehicle_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS tenant.estimates ADD CONSTRAINT estimates_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES tenant.vehicles(id) ON DELETE RESTRICT';
  END IF;
END $$;

-- 5) Ensure RLS is enabled on tenant.vehicles
ALTER TABLE IF EXISTS tenant.vehicles ENABLE ROW LEVEL SECURITY;

-- 6) Re-create RLS policies for tenant.vehicles
DROP POLICY IF EXISTS vehicles_select ON tenant.vehicles;
CREATE POLICY vehicles_select ON tenant.vehicles FOR SELECT
  USING (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS vehicles_insert ON tenant.vehicles;
CREATE POLICY vehicles_insert ON tenant.vehicles FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS vehicles_update ON tenant.vehicles;
CREATE POLICY vehicles_update ON tenant.vehicles FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (auth.jwt() ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

DROP POLICY IF EXISTS vehicles_delete ON tenant.vehicles;
CREATE POLICY vehicles_delete ON tenant.vehicles FOR DELETE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role','platform_admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin'
    OR (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );
