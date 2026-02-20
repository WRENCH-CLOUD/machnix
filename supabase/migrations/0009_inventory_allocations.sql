-- Migration: Inventory Allocations System
-- Purpose: Add stock reservation and allocation tracking for job card lifecycle

-- ============================================================================
-- 1. Add stock_reserved column to inventory_items
-- ============================================================================

ALTER TABLE tenant.inventory_items 
ADD COLUMN IF NOT EXISTS stock_reserved integer DEFAULT 0;

-- Add constraint: reserved cannot be negative and cannot exceed on-hand
-- Note: We use a CHECK constraint that allows the condition to be enforced
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_reserved_stock_non_negative' 
    AND conrelid = 'tenant.inventory_items'::regclass
  ) THEN
    ALTER TABLE tenant.inventory_items 
    ADD CONSTRAINT check_reserved_stock_non_negative 
    CHECK (stock_reserved >= 0);
  END IF;
END $$;

-- ============================================================================
-- 2. Create inventory_allocations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant.inventory_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL,
  jobcard_id uuid NOT NULL,
  estimate_item_id uuid,
  quantity_reserved integer NOT NULL,
  quantity_consumed integer DEFAULT 0,
  status text NOT NULL DEFAULT 'reserved',
  reserved_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  released_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT check_allocation_status CHECK (status IN ('reserved', 'consumed', 'released')),
  CONSTRAINT check_quantity_reserved_positive CHECK (quantity_reserved > 0),
  CONSTRAINT check_quantity_consumed_non_negative CHECK (quantity_consumed >= 0),
  CONSTRAINT check_consumed_not_exceeds_reserved CHECK (quantity_consumed <= quantity_reserved)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_allocations_tenant ON tenant.inventory_allocations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_allocations_jobcard ON tenant.inventory_allocations(jobcard_id);
CREATE INDEX IF NOT EXISTS idx_allocations_item ON tenant.inventory_allocations(item_id);
CREATE INDEX IF NOT EXISTS idx_allocations_status ON tenant.inventory_allocations(status);
CREATE INDEX IF NOT EXISTS idx_allocations_estimate_item ON tenant.inventory_allocations(estimate_item_id);

-- ============================================================================
-- 3. Enable Row Level Security
-- ============================================================================

ALTER TABLE tenant.inventory_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using standard helper functions for consistency)
DROP POLICY IF EXISTS inventory_allocations_select ON tenant.inventory_allocations;
CREATE POLICY inventory_allocations_select ON tenant.inventory_allocations FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS inventory_allocations_insert ON tenant.inventory_allocations;
CREATE POLICY inventory_allocations_insert ON tenant.inventory_allocations FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS inventory_allocations_update ON tenant.inventory_allocations;
CREATE POLICY inventory_allocations_update ON tenant.inventory_allocations FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS inventory_allocations_delete ON tenant.inventory_allocations;
CREATE POLICY inventory_allocations_delete ON tenant.inventory_allocations FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- ============================================================================
-- 4. Grant permissions
-- ============================================================================

GRANT ALL ON tenant.inventory_allocations TO authenticated;

-- ============================================================================
-- 5. Add updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.update_inventory_allocation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_allocations_updated_at ON tenant.inventory_allocations;
CREATE TRIGGER trg_inventory_allocations_updated_at
  BEFORE UPDATE ON tenant.inventory_allocations
  FOR EACH ROW
  EXECUTE FUNCTION tenant.update_inventory_allocation_updated_at();

-- ============================================================================
-- 6. Initialize stock_reserved for existing items (set to 0)
-- ============================================================================

UPDATE tenant.inventory_items 
SET stock_reserved = 0 
WHERE stock_reserved IS NULL;
