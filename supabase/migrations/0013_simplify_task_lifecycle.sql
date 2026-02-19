-- Migration: Simplify Task Lifecycle
-- Purpose: 
--   1. Reduce task statuses to DRAFT / APPROVED / COMPLETED (remove IN_PROGRESS, CANCELLED)
--   2. Replace action types: NO_CHANGE + REPAIRED → LABOR_ONLY (keep REPLACED)
--   3. Auto-derive action_type from inventory_item_id

-- ============================================================================
-- 1. Migrate existing task statuses
-- ============================================================================

-- IN_PROGRESS → APPROVED (still active, just simplify)
UPDATE tenant.job_card_tasks
SET task_status = 'APPROVED'
WHERE task_status = 'IN_PROGRESS';

-- CANCELLED → soft-delete (preserve data but mark as deleted)
UPDATE tenant.job_card_tasks
SET deleted_at = COALESCE(deleted_at, now()),
    deleted_by = COALESCE(deleted_by, created_by)
WHERE task_status = 'CANCELLED'
  AND deleted_at IS NULL;

-- Change CANCELLED status to DRAFT for the soft-deleted rows (satisfy new CHECK)
UPDATE tenant.job_card_tasks
SET task_status = 'DRAFT'
WHERE task_status = 'CANCELLED';

-- ============================================================================
-- 2. Update task_status CHECK constraint
-- ============================================================================

ALTER TABLE tenant.job_card_tasks
  DROP CONSTRAINT IF EXISTS check_task_status;

ALTER TABLE tenant.job_card_tasks
  ADD CONSTRAINT check_task_status
  CHECK (task_status IN ('DRAFT', 'APPROVED', 'COMPLETED'));

-- ============================================================================
-- 3. Migrate action types
-- ============================================================================

-- NO_CHANGE and REPAIRED → LABOR_ONLY
UPDATE tenant.job_card_tasks
SET action_type = 'LABOR_ONLY'
WHERE action_type IN ('NO_CHANGE', 'REPAIRED');

-- ============================================================================
-- 4. Update action_type CHECK constraint
-- ============================================================================

ALTER TABLE tenant.job_card_tasks
  DROP CONSTRAINT IF EXISTS check_action_type;

ALTER TABLE tenant.job_card_tasks
  ADD CONSTRAINT check_action_type
  CHECK (action_type IN ('LABOR_ONLY', 'REPLACED'));

-- ============================================================================
-- 5. Update the REPLACED inventory constraint
-- ============================================================================

-- Drop old constraint and re-add with new action type
ALTER TABLE tenant.job_card_tasks
  DROP CONSTRAINT IF EXISTS check_replaced_has_inventory;

ALTER TABLE tenant.job_card_tasks
  ADD CONSTRAINT check_replaced_has_inventory
  CHECK (
    action_type != 'REPLACED' OR (inventory_item_id IS NOT NULL AND qty IS NOT NULL AND qty > 0)
  );

-- ============================================================================
-- 6. Auto-correct action_type based on inventory linkage
-- ============================================================================

-- If a task has an inventory item, it should be REPLACED
UPDATE tenant.job_card_tasks
SET action_type = 'REPLACED'
WHERE inventory_item_id IS NOT NULL
  AND qty IS NOT NULL
  AND qty > 0
  AND action_type != 'REPLACED';

-- If a task has no inventory item, it should be LABOR_ONLY
UPDATE tenant.job_card_tasks
SET action_type = 'LABOR_ONLY'
WHERE (inventory_item_id IS NULL OR qty IS NULL OR qty <= 0)
  AND action_type != 'LABOR_ONLY';

-- ============================================================================
-- 7. Update task_templates action_type (if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'tenant' AND table_name = 'task_templates'
  ) THEN
    UPDATE tenant.task_templates
    SET default_action_type = 'LABOR_ONLY'
    WHERE default_action_type IN ('NO_CHANGE', 'REPAIRED');
  END IF;
END $$;
