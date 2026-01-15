-- Add missing columns to tenant.vehicles table (mileage, color, license_plate, make, model, updated_at, soft delete)
-- Keep FK columns (make_id, model_id) and add text columns as denormalized cache for display

-- 1) Add missing columns to tenant.vehicles
ALTER TABLE IF EXISTS tenant.vehicles 
  ADD COLUMN IF NOT EXISTS make text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS mileage integer,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS license_plate text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- 2) Populate text make/model from FK references if available
UPDATE tenant.vehicles v
SET 
  make = COALESCE(v.make, (SELECT name FROM public.vehicle_make WHERE id = v.make_id)),
  model = COALESCE(v.model, (SELECT name FROM public.vehicle_model WHERE id = v.model_id)),
  license_plate = COALESCE(v.license_plate, v.reg_no)
WHERE v.make IS NULL OR v.model IS NULL OR v.license_plate IS NULL;

-- 3) Create updated_at trigger for tenant.vehicles
DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON tenant.vehicles;
CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON tenant.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamps();

-- 4) Ensure jobcards.vehicle_id references tenant.vehicles (should already be correct from initial setup)
-- Only modify if it was previously changed to public.vehicles
DO $$
BEGIN
  -- Drop the FK if it points to public.vehicles
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'tenant' AND tc.table_name = 'jobcards' 
    AND tc.constraint_name = 'jobcards_vehicle_id_fkey'
    AND ccu.table_schema = 'public' AND ccu.table_name = 'vehicles'
  ) THEN
    ALTER TABLE tenant.jobcards DROP CONSTRAINT jobcards_vehicle_id_fkey;
    ALTER TABLE tenant.jobcards
      ADD CONSTRAINT jobcards_vehicle_id_fkey
      FOREIGN KEY (vehicle_id)
      REFERENCES tenant.vehicles(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- 5) Same for estimates.vehicle_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'tenant' AND tc.table_name = 'estimates' 
    AND tc.constraint_name = 'estimates_vehicle_id_fkey'
    AND ccu.table_schema = 'public' AND ccu.table_name = 'vehicles'
  ) THEN
    ALTER TABLE tenant.estimates DROP CONSTRAINT estimates_vehicle_id_fkey;
    ALTER TABLE tenant.estimates
      ADD CONSTRAINT estimates_vehicle_id_fkey
      FOREIGN KEY (vehicle_id)
      REFERENCES tenant.vehicles(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- 6) Drop public.vehicles if it exists (it shouldn't be used)
DROP TABLE IF EXISTS public.vehicles;
