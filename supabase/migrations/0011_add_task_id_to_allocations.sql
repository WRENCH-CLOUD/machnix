-- Migration: Add task_id to inventory_allocations
-- Purpose: Link allocations directly to tasks (similar to estimate_item_id)

-- ============================================================================
-- 1. Add task_id column to inventory_allocations
-- ============================================================================

ALTER TABLE tenant.inventory_allocations 
ADD COLUMN IF NOT EXISTS task_id uuid;

-- Create index for efficient task-based lookups
CREATE INDEX IF NOT EXISTS idx_allocations_task 
  ON tenant.inventory_allocations(task_id) 
  WHERE task_id IS NOT NULL;

-- ============================================================================
-- 2. Add foreign key constraint to job_card_tasks
-- ============================================================================

ALTER TABLE tenant.inventory_allocations 
  DROP CONSTRAINT IF EXISTS fk_allocations_task;
  
ALTER TABLE tenant.inventory_allocations 
  ADD CONSTRAINT fk_allocations_task 
  FOREIGN KEY (task_id) 
  REFERENCES tenant.job_card_tasks(id) 
  ON DELETE SET NULL;

-- ============================================================================
-- 3. Check constraint: either estimate_item_id or task_id, not both
-- ============================================================================

-- Note: We allow both to be null (for manual allocations), but not both set
ALTER TABLE tenant.inventory_allocations
  DROP CONSTRAINT IF EXISTS check_allocation_source_exclusivity;

ALTER TABLE tenant.inventory_allocations
  ADD CONSTRAINT check_allocation_source_exclusivity
  CHECK (
    NOT (estimate_item_id IS NOT NULL AND task_id IS NOT NULL)
  );

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- Existing allocations with task linkage use job_card_tasks.allocation_id
-- This migration adds the reverse link for efficient lookups:
--   findByTaskId(taskId) - lookup allocation from task side
--
-- The bi-directional relationship allows:
--   Task → Allocation via allocation_id on task
--   Allocation → Task via task_id on allocation (NEW)
--
-- This mirrors how estimate_item_id works for estimates.
