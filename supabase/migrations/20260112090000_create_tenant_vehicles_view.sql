-- Fix for vehicle cross-schema relationship bug
-- Creates tenant.vehicles view wrapping public.vehicles to restore PostgREST relationships
-- This addresses the issue where migration 20260106011000 moved vehicles to public schema
-- but repository code still queries tenant.vehicles

-- 1) Create the view with all vehicle columns plus customer details
CREATE OR REPLACE VIEW tenant.vehicles AS
SELECT
  v.id,
  v.tenant_id,
  v.customer_id,
  v.reg_no,
  v.vin,
  v.make,
  v.model,
  v.year,
  v.odometer,
  v.mileage,
  v.color,
  v.license_plate,
  v.notes,
  v.created_at,
  v.updated_at,
  v.deleted_at,
  v.deleted_by,
  -- Customer details for convenience (avoids separate join in app code)
  c.name AS customer_name,
  c.phone AS customer_phone,
  c.email AS customer_email
FROM public.vehicles v
LEFT JOIN tenant.customers c ON c.id = v.customer_id AND c.tenant_id = v.tenant_id;

-- 2) Grant access to the view
GRANT SELECT ON tenant.vehicles TO authenticated;
GRANT SELECT ON tenant.vehicles TO anon;
GRANT ALL ON tenant.vehicles TO service_role;

-- 3) Create INSTEAD OF triggers to make the view updatable
-- This allows INSERT/UPDATE/DELETE operations to pass through to public.vehicles

-- INSERT trigger
CREATE OR REPLACE FUNCTION tenant.vehicles_insert_trigger()
RETURNS TRIGGER AS $$
DECLARE
  inserted_id uuid;
BEGIN
  INSERT INTO public.vehicles (
    id, tenant_id, customer_id, reg_no, vin, make, model, year,
    odometer, mileage, color, license_plate, notes, created_at, updated_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.tenant_id,
    NEW.customer_id,
    NEW.reg_no,
    NEW.vin,
    NEW.make,
    NEW.model,
    NEW.year,
    NEW.odometer,
    NEW.mileage,
    NEW.color,
    NEW.license_plate,
    NEW.notes,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  RETURNING id INTO inserted_id;
  
  -- Return the view row (with customer columns) for proper structure
  SELECT v.id, v.tenant_id, v.customer_id, v.reg_no, v.vin, v.make, v.model, v.year,
         v.odometer, v.mileage, v.color, v.license_plate, v.notes, v.created_at, 
         v.updated_at, v.deleted_at, v.deleted_by, c.name, c.phone, c.email
  INTO NEW.id, NEW.tenant_id, NEW.customer_id, NEW.reg_no, NEW.vin, NEW.make, NEW.model, 
       NEW.year, NEW.odometer, NEW.mileage, NEW.color, NEW.license_plate, NEW.notes, 
       NEW.created_at, NEW.updated_at, NEW.deleted_at, NEW.deleted_by, 
       NEW.customer_name, NEW.customer_phone, NEW.customer_email
  FROM public.vehicles v
  LEFT JOIN tenant.customers c ON c.id = v.customer_id
  WHERE v.id = inserted_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS vehicles_insert ON tenant.vehicles;
CREATE TRIGGER vehicles_insert
  INSTEAD OF INSERT ON tenant.vehicles
  FOR EACH ROW EXECUTE FUNCTION tenant.vehicles_insert_trigger();

-- UPDATE trigger
CREATE OR REPLACE FUNCTION tenant.vehicles_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vehicles SET
    customer_id = NEW.customer_id,
    reg_no = NEW.reg_no,
    vin = NEW.vin,
    make = NEW.make,
    model = NEW.model,
    year = NEW.year,
    odometer = NEW.odometer,
    mileage = NEW.mileage,
    color = NEW.color,
    license_plate = NEW.license_plate,
    notes = NEW.notes,
    updated_at = now()
  WHERE id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS vehicles_update ON tenant.vehicles;
CREATE TRIGGER vehicles_update
  INSTEAD OF UPDATE ON tenant.vehicles
  FOR EACH ROW EXECUTE FUNCTION tenant.vehicles_update_trigger();

-- DELETE trigger
CREATE OR REPLACE FUNCTION tenant.vehicles_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.vehicles WHERE id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS vehicles_delete ON tenant.vehicles;
CREATE TRIGGER vehicles_delete
  INSTEAD OF DELETE ON tenant.vehicles
  FOR EACH ROW EXECUTE FUNCTION tenant.vehicles_delete_trigger();
