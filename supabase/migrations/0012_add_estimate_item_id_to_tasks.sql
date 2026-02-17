-- ============================================================================
-- MIGRATION: Add estimate_item_id to job_card_tasks for task-estimate sync
-- ============================================================================
-- Tasks should sync to estimates so customers can see work items before
-- the job starts. This adds a bidirectional link between tasks and estimate_items.

-- 1. Add estimate_item_id column
ALTER TABLE tenant.job_card_tasks 
  ADD COLUMN IF NOT EXISTS estimate_item_id uuid;

-- 2. Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_job_card_tasks_estimate_item 
  ON tenant.job_card_tasks(estimate_item_id) 
  WHERE estimate_item_id IS NOT NULL;

-- 3. Add foreign key constraint (deferred to allow task-estimate sync order flexibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'job_card_tasks_estimate_item_id_fkey'
    AND table_schema = 'tenant'
  ) THEN
    ALTER TABLE tenant.job_card_tasks 
      ADD CONSTRAINT job_card_tasks_estimate_item_id_fkey 
      FOREIGN KEY (estimate_item_id) 
      REFERENCES tenant.estimate_items(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Add task_id to estimate_items for reverse lookup (optional but useful)
ALTER TABLE tenant.estimate_items 
  ADD COLUMN IF NOT EXISTS task_id uuid;

CREATE INDEX IF NOT EXISTS idx_estimate_items_task 
  ON tenant.estimate_items(task_id) 
  WHERE task_id IS NOT NULL;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'estimate_items_task_id_fkey'
    AND table_schema = 'tenant'
  ) THEN
    ALTER TABLE tenant.estimate_items 
      ADD CONSTRAINT estimate_items_task_id_fkey 
      FOREIGN KEY (task_id) 
      REFERENCES tenant.job_card_tasks(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- COMMENT
-- ============================================================================
COMMENT ON COLUMN tenant.job_card_tasks.estimate_item_id IS 
  'Links task to corresponding estimate line item for customer visibility';
COMMENT ON COLUMN tenant.estimate_items.task_id IS 
  'Links estimate item back to the task that generated it';
