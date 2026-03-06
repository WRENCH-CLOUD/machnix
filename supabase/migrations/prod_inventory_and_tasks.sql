-- =============================================================================
-- PRODUCTION MIGRATION: Inventory Allocations + Job Card Tasks + Task-Estimate Sync
-- Consolidates: 0009, 0010, 0011, 0012, 0013
-- Run this on a FRESH prod DB that has migrations up to 0008.
-- Wrap in a transaction so it's all-or-nothing.
-- =============================================================================

BEGIN;

-- #############################################################################
-- PART 1 — Inventory Allocations  (was 0009)
-- #############################################################################

-- 1a. Add stock_reserved to inventory_items
ALTER TABLE tenant.inventory_items
  ADD COLUMN IF NOT EXISTS stock_reserved integer DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_reserved_stock_non_negative'
      AND conrelid = 'tenant.inventory_items'::regclass
  ) THEN
    ALTER TABLE tenant.inventory_items
      ADD CONSTRAINT check_reserved_stock_non_negative CHECK (stock_reserved >= 0);
  END IF;
END $$;

UPDATE tenant.inventory_items
SET stock_reserved = 0
WHERE stock_reserved IS NULL;

-- 1b. Create inventory_allocations table
--     (already includes the task_id column from 0011)
CREATE TABLE IF NOT EXISTS tenant.inventory_allocations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL,
  item_id            uuid NOT NULL,
  jobcard_id         uuid NOT NULL,
  estimate_item_id   uuid,
  task_id            uuid,                        -- from 0011
  quantity_reserved  integer NOT NULL,
  quantity_consumed  integer DEFAULT 0,
  status             text NOT NULL DEFAULT 'reserved',
  reserved_at        timestamptz NOT NULL DEFAULT now(),
  consumed_at        timestamptz,
  released_at        timestamptz,
  created_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT check_allocation_status               CHECK (status IN ('reserved', 'consumed', 'released')),
  CONSTRAINT check_quantity_reserved_positive       CHECK (quantity_reserved > 0),
  CONSTRAINT check_quantity_consumed_non_negative   CHECK (quantity_consumed >= 0),
  CONSTRAINT check_consumed_not_exceeds_reserved    CHECK (quantity_consumed <= quantity_reserved)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_allocations_tenant        ON tenant.inventory_allocations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_allocations_jobcard       ON tenant.inventory_allocations(jobcard_id);
CREATE INDEX IF NOT EXISTS idx_allocations_item          ON tenant.inventory_allocations(item_id);
CREATE INDEX IF NOT EXISTS idx_allocations_status        ON tenant.inventory_allocations(status);
CREATE INDEX IF NOT EXISTS idx_allocations_estimate_item ON tenant.inventory_allocations(estimate_item_id);
CREATE INDEX IF NOT EXISTS idx_allocations_task          ON tenant.inventory_allocations(task_id) WHERE task_id IS NOT NULL;

-- RLS
ALTER TABLE tenant.inventory_allocations ENABLE ROW LEVEL SECURITY;

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

GRANT ALL ON tenant.inventory_allocations TO authenticated;

-- updated_at trigger
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


-- #############################################################################
-- PART 2 — Job Card Tasks + Inventory Delta Indexes  (was 0010)
-- #############################################################################

-- 2a. Create job_card_tasks table
--     Uses the FINAL simplified schema (statuses & action types from 0013,
--     estimate_item_id from 0012).
CREATE TABLE IF NOT EXISTS tenant.job_card_tasks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL,
  jobcard_id           uuid NOT NULL,

  -- Task description
  task_name            text NOT NULL,
  description          text,

  -- Action type (simplified from 0013)
  action_type          text NOT NULL DEFAULT 'LABOR_ONLY',

  -- Inventory linkage (only when action_type = 'REPLACED')
  inventory_item_id    uuid,
  qty                  integer,

  -- Price snapshots
  unit_price_snapshot  numeric(12,2),
  labor_cost_snapshot  numeric(12,2) DEFAULT 0,
  tax_rate_snapshot    numeric(5,2) DEFAULT 0,

  -- Task lifecycle (simplified from 0013)
  task_status          text NOT NULL DEFAULT 'DRAFT',

  -- Allocation reference
  allocation_id        uuid,

  -- Estimate item linkage (from 0012)
  estimate_item_id     uuid,

  -- Audit
  created_by           uuid,
  approved_by          uuid,
  approved_at          timestamptz,
  completed_by         uuid,
  completed_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  -- Estimate visibility control
  show_in_estimate     boolean NOT NULL DEFAULT true,

  -- Soft delete
  deleted_at           timestamptz,
  deleted_by           uuid,

  -- Constraints (already simplified)
  CONSTRAINT check_action_type          CHECK (action_type IN ('LABOR_ONLY', 'REPLACED')),
  CONSTRAINT check_task_status          CHECK (task_status IN ('DRAFT', 'APPROVED', 'COMPLETED')),
  CONSTRAINT check_replaced_has_inventory CHECK (
    action_type != 'REPLACED' OR (inventory_item_id IS NOT NULL AND qty IS NOT NULL AND qty > 0)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_tenant         ON tenant.job_card_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_jobcard        ON tenant.job_card_tasks(jobcard_id);
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_inventory_item ON tenant.job_card_tasks(inventory_item_id) WHERE inventory_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_status          ON tenant.job_card_tasks(task_status);
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_allocation      ON tenant.job_card_tasks(allocation_id) WHERE allocation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_estimate_item   ON tenant.job_card_tasks(estimate_item_id) WHERE estimate_item_id IS NOT NULL;

-- RLS
ALTER TABLE tenant.job_card_tasks ENABLE ROW LEVEL SECURITY;

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

GRANT ALL ON tenant.job_card_tasks TO authenticated;

-- updated_at trigger
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

-- 2b. Inventory delta-sync indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_updated_at
  ON tenant.inventory_items(updated_at);

CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_updated
  ON tenant.inventory_items(tenant_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_inventory_items_deleted_at
  ON tenant.inventory_items(deleted_at)
  WHERE deleted_at IS NOT NULL;


-- #############################################################################
-- PART 3 — Foreign Keys (from 0010 + 0011)
-- #############################################################################

-- job_card_tasks → inventory_items
ALTER TABLE tenant.job_card_tasks
  DROP CONSTRAINT IF EXISTS fk_job_card_tasks_inventory_item;
ALTER TABLE tenant.job_card_tasks
  ADD CONSTRAINT fk_job_card_tasks_inventory_item
  FOREIGN KEY (inventory_item_id) REFERENCES tenant.inventory_items(id) ON DELETE SET NULL;

-- job_card_tasks → inventory_allocations
ALTER TABLE tenant.job_card_tasks
  DROP CONSTRAINT IF EXISTS fk_job_card_tasks_allocation;
ALTER TABLE tenant.job_card_tasks
  ADD CONSTRAINT fk_job_card_tasks_allocation
  FOREIGN KEY (allocation_id) REFERENCES tenant.inventory_allocations(id) ON DELETE SET NULL;

-- job_card_tasks → jobcards
ALTER TABLE tenant.job_card_tasks
  DROP CONSTRAINT IF EXISTS fk_job_card_tasks_jobcard;
ALTER TABLE tenant.job_card_tasks
  ADD CONSTRAINT fk_job_card_tasks_jobcard
  FOREIGN KEY (jobcard_id) REFERENCES tenant.jobcards(id) ON DELETE CASCADE;

-- inventory_allocations → job_card_tasks  (from 0011)
ALTER TABLE tenant.inventory_allocations
  DROP CONSTRAINT IF EXISTS fk_allocations_task;
ALTER TABLE tenant.inventory_allocations
  ADD CONSTRAINT fk_allocations_task
  FOREIGN KEY (task_id) REFERENCES tenant.job_card_tasks(id) ON DELETE SET NULL;

-- Exclusivity: allocation linked to either estimate_item OR task, not both
ALTER TABLE tenant.inventory_allocations
  DROP CONSTRAINT IF EXISTS check_allocation_source_exclusivity;
ALTER TABLE tenant.inventory_allocations
  ADD CONSTRAINT check_allocation_source_exclusivity
  CHECK (NOT (estimate_item_id IS NOT NULL AND task_id IS NOT NULL));


-- #############################################################################
-- PART 4 — Task ↔ Estimate bidirectional link  (was 0012)
-- #############################################################################

-- estimate_items → task_id reverse lookup
ALTER TABLE tenant.estimate_items
  ADD COLUMN IF NOT EXISTS task_id uuid;

CREATE INDEX IF NOT EXISTS idx_estimate_items_task
  ON tenant.estimate_items(task_id) WHERE task_id IS NOT NULL;

-- job_card_tasks.estimate_item_id → estimate_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'job_card_tasks_estimate_item_id_fkey'
      AND table_schema = 'tenant'
  ) THEN
    ALTER TABLE tenant.job_card_tasks
      ADD CONSTRAINT job_card_tasks_estimate_item_id_fkey
      FOREIGN KEY (estimate_item_id) REFERENCES tenant.estimate_items(id) ON DELETE SET NULL;
  END IF;
END $$;

-- estimate_items.task_id → job_card_tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'estimate_items_task_id_fkey'
      AND table_schema = 'tenant'
  ) THEN
    ALTER TABLE tenant.estimate_items
      ADD CONSTRAINT estimate_items_task_id_fkey
      FOREIGN KEY (task_id) REFERENCES tenant.job_card_tasks(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN tenant.job_card_tasks.estimate_item_id IS
  'Links task to corresponding estimate line item for customer visibility';
COMMENT ON COLUMN tenant.estimate_items.task_id IS
  'Links estimate item back to the task that generated it';


-- #############################################################################
-- PART 5 — Inventory availability view  (was 0010)
-- #############################################################################

CREATE OR REPLACE VIEW tenant.inventory_items_with_availability AS
SELECT
  i.*,
  (i.stock_on_hand - COALESCE(i.stock_reserved, 0)) AS stock_available
FROM tenant.inventory_items i;

GRANT SELECT ON tenant.inventory_items_with_availability TO authenticated;


-- #############################################################################
-- DONE
-- #############################################################################

COMMIT;
