-- Migration: Job Card Tasks Table + Inventory Delta Sync Support
-- Purpose: 
--   1. Create job_card_tasks table to replace JSONB todos in jobcards.details
--   2. Add indexes for efficient inventory delta fetching

-- ============================================================================
-- 1. Create job_card_tasks table
-- ============================================================================

-- Task action types
-- NO_CHANGE: Inspection only, no action taken
-- REPAIRED: Part/component was repaired (no inventory impact)
-- REPLACED: Part was replaced (inventory consumption)

CREATE TABLE IF NOT EXISTS tenant.job_card_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  jobcard_id uuid NOT NULL,
  
  -- Task description
  task_name text NOT NULL,
  description text,
  
  -- Action type determines inventory behavior
  action_type text NOT NULL DEFAULT 'NO_CHANGE',
  
  -- Inventory linkage (only when action_type = 'REPLACED')
  inventory_item_id uuid,
  qty integer,
  
  -- Price snapshot (immutable after approval)
  unit_price_snapshot numeric(12,2),
  labor_cost_snapshot numeric(12,2) DEFAULT 0,
  tax_rate_snapshot numeric(5,2) DEFAULT 0,
  
  -- Task lifecycle status
  task_status text NOT NULL DEFAULT 'DRAFT',
  
  -- Allocation reference (for inventory reservation tracking)
  allocation_id uuid,
  
  -- Audit fields
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Soft delete
  deleted_at timestamptz,
  deleted_by uuid,
  
  -- Constraints
  CONSTRAINT check_action_type CHECK (action_type IN ('NO_CHANGE', 'REPAIRED', 'REPLACED')),
  CONSTRAINT check_task_status CHECK (task_status IN ('DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT check_replaced_has_inventory CHECK (
    action_type != 'REPLACED' OR (inventory_item_id IS NOT NULL AND qty IS NOT NULL AND qty > 0)
  )
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_tenant ON tenant.job_card_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_jobcard ON tenant.job_card_tasks(jobcard_id);
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_inventory_item ON tenant.job_card_tasks(inventory_item_id) WHERE inventory_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_status ON tenant.job_card_tasks(task_status);
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_allocation ON tenant.job_card_tasks(allocation_id) WHERE allocation_id IS NOT NULL;

-- ============================================================================
-- 2. Enable Row Level Security
-- ============================================================================

ALTER TABLE tenant.job_card_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS job_card_tasks_select ON tenant.job_card_tasks;
CREATE POLICY job_card_tasks_select ON tenant.job_card_tasks FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS job_card_tasks_insert ON tenant.job_card_tasks;
CREATE POLICY job_card_tasks_insert ON tenant.job_card_tasks FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS job_card_tasks_update ON tenant.job_card_tasks;
CREATE POLICY job_card_tasks_update ON tenant.job_card_tasks FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS job_card_tasks_delete ON tenant.job_card_tasks;
CREATE POLICY job_card_tasks_delete ON tenant.job_card_tasks FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- ============================================================================
-- 3. Grant permissions
-- ============================================================================

GRANT ALL ON tenant.job_card_tasks TO authenticated;

-- ============================================================================
-- 4. Add updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.update_job_card_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_card_tasks_updated_at ON tenant.job_card_tasks;
CREATE TRIGGER trg_job_card_tasks_updated_at
  BEFORE UPDATE ON tenant.job_card_tasks
  FOR EACH ROW
  EXECUTE FUNCTION tenant.update_job_card_task_updated_at();

-- ============================================================================
-- 5. Add index for inventory delta fetching
-- ============================================================================

-- Index on updated_at for efficient delta queries
-- This enables: SELECT * FROM inventory_items WHERE updated_at > $1
CREATE INDEX IF NOT EXISTS idx_inventory_items_updated_at 
  ON tenant.inventory_items(updated_at);

-- Composite index for delta queries with tenant filter
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_updated 
  ON tenant.inventory_items(tenant_id, updated_at);

-- Index on deleted_at for tracking soft deletes in delta sync
CREATE INDEX IF NOT EXISTS idx_inventory_items_deleted_at 
  ON tenant.inventory_items(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- 6. Add foreign key constraints (deferred to allow data migration)
-- ============================================================================

-- Note: We don't add FK to jobcards yet to allow gradual migration
-- The application layer will enforce referential integrity during transition

-- Foreign key to inventory_items
ALTER TABLE tenant.job_card_tasks 
  DROP CONSTRAINT IF EXISTS fk_job_card_tasks_inventory_item;
  
ALTER TABLE tenant.job_card_tasks 
  ADD CONSTRAINT fk_job_card_tasks_inventory_item 
  FOREIGN KEY (inventory_item_id) 
  REFERENCES tenant.inventory_items(id) 
  ON DELETE SET NULL;

-- Foreign key to inventory_allocations
ALTER TABLE tenant.job_card_tasks 
  DROP CONSTRAINT IF EXISTS fk_job_card_tasks_allocation;
  
ALTER TABLE tenant.job_card_tasks 
  ADD CONSTRAINT fk_job_card_tasks_allocation 
  FOREIGN KEY (allocation_id) 
  REFERENCES tenant.inventory_allocations(id) 
  ON DELETE SET NULL;

-- Foreign key to jobcards
ALTER TABLE tenant.job_card_tasks 
  DROP CONSTRAINT IF EXISTS fk_job_card_tasks_jobcard;
  
ALTER TABLE tenant.job_card_tasks 
  ADD CONSTRAINT fk_job_card_tasks_jobcard 
  FOREIGN KEY (jobcard_id) 
  REFERENCES tenant.jobcards(id) 
  ON DELETE CASCADE;

-- ============================================================================
-- 7. Create view for inventory delta sync
-- ============================================================================

-- View that includes computed available stock for delta responses
CREATE OR REPLACE VIEW tenant.inventory_items_with_availability AS
SELECT 
  i.*,
  (i.stock_on_hand - COALESCE(i.stock_reserved, 0)) AS stock_available
FROM tenant.inventory_items i;

-- Grant access to view
GRANT SELECT ON tenant.inventory_items_with_availability TO authenticated;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- The `details.todos` JSONB field in jobcards will be deprecated but NOT removed.
-- A separate data migration script should:
-- 1. Read todos from jobcards.details
-- 2. Insert corresponding rows into job_card_tasks
-- 3. Mark migrated jobcards (e.g., set details.todos_migrated = true)
--
-- The application should:
-- 1. Read from job_card_tasks first
-- 2. Fall back to details.todos if empty (for non-migrated jobs)
-- 3. Write ONLY to job_card_tasks going forward
