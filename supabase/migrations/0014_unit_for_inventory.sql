-- =============================================================================
-- 0014_unit_for_inventory.sql
-- Adds a units reference table and links inventory_items to it via FK
-- =============================================================================

BEGIN;

-- 1) Units table (tenant scoped)
CREATE TABLE IF NOT EXISTS tenant.units (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  unit_name  text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure updated_at exists for existing tables and keep it in sync on UPDATE
ALTER TABLE tenant.units
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at ON tenant.units;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tenant.units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure FK to tenants
ALTER TABLE tenant.units
  DROP CONSTRAINT IF EXISTS units_tenant_id_fkey;

ALTER TABLE tenant.units
  ADD CONSTRAINT units_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE;

-- Tenant isolation index
CREATE INDEX IF NOT EXISTS idx_units_tenant_id
  ON tenant.units(tenant_id);

-- Enable RLS and tenant-scoped policies for units
ALTER TABLE tenant.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_units_select
  ON tenant.units
  FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

CREATE POLICY tenant_units_insert
  ON tenant.units
  FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

CREATE POLICY tenant_units_update
  ON tenant.units
  FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

CREATE POLICY tenant_units_delete
  ON tenant.units
  FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- 2) Link inventory_items → units
ALTER TABLE tenant.inventory_items
  ADD COLUMN IF NOT EXISTS unit_id uuid;

ALTER TABLE tenant.inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_unit_id_fkey;

ALTER TABLE tenant.inventory_items
  ADD CONSTRAINT inventory_items_unit_id_fkey
  FOREIGN KEY (unit_id) REFERENCES tenant.units(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_inventory_items_unit_id
  ON tenant.inventory_items(unit_id);

-- 3) Backfill existing items so every item has a unit
--    For each tenant, create a default unit ('Unit') if it doesn't exist,
--    then assign it to any inventory_items that have NULL unit_id.
WITH tenant_defaults AS (
  INSERT INTO tenant.units (tenant_id, unit_name)
  SELECT t.id, 'Unit'
  FROM tenant.tenants t
  WHERE NOT EXISTS (
    SELECT 1 FROM tenant.units u
    WHERE u.tenant_id = t.id
      AND u.unit_name = 'Unit'
  )
  RETURNING tenant_id, id
),
existing_defaults AS (
  SELECT tenant_id, id
  FROM tenant.units
  WHERE unit_name = 'Unit'
)
UPDATE tenant.inventory_items i
SET unit_id = COALESCE(td.id, ed.id)
FROM (
  SELECT * FROM tenant_defaults
  UNION
  SELECT * FROM existing_defaults
) AS td_ed(tenant_id, id)
LEFT JOIN tenant_defaults td ON td.tenant_id = td_ed.tenant_id
LEFT JOIN existing_defaults ed ON ed.tenant_id = td_ed.tenant_id
WHERE i.tenant_id = td_ed.tenant_id
  AND i.unit_id IS NULL;

-- 4) Enforce NOT NULL on unit_id now that everything is backfilled
ALTER TABLE tenant.inventory_items
  ALTER COLUMN unit_id SET NOT NULL;

COMMIT;
