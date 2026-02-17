-- Migration: Add soft delete columns to estimate_items
-- Purpose: Enable soft deletion of estimate items when tasks are removed or changed to NO_CHANGE
-- The task-estimate sync service uses deleted_at for soft delete operations

-- Add soft delete columns to estimate_items
ALTER TABLE tenant.estimate_items 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- Create index for efficient queries filtering out deleted items
CREATE INDEX IF NOT EXISTS idx_estimate_items_deleted_at 
  ON tenant.estimate_items(deleted_at) 
  WHERE deleted_at IS NULL;

-- Comment on columns
COMMENT ON COLUMN tenant.estimate_items.deleted_at IS 'Soft delete timestamp - when null, item is active';
COMMENT ON COLUMN tenant.estimate_items.deleted_by IS 'User who soft-deleted this item';
