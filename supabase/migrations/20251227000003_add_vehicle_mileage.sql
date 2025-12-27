-- Add mileage and updated_at to vehicles
ALTER TABLE tenant.vehicles ADD COLUMN IF NOT EXISTS mileage integer;
ALTER TABLE tenant.vehicles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
