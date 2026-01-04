-- =====================================================
-- MIGRATION: Add missing foreign key from estimate_items to estimates
-- =====================================================
-- 
-- This migration addresses the following issue:
-- The estimate_items.estimate_id column exists but has no foreign key 
-- constraint to estimates.id, which prevents Supabase from detecting
-- the relationship for joins.
-- 
-- =====================================================

-- Add foreign key constraint for estimate_items.estimate_id
ALTER TABLE tenant.estimate_items 
  DROP CONSTRAINT IF EXISTS estimate_items_estimate_id_fkey;
ALTER TABLE tenant.estimate_items 
  ADD CONSTRAINT estimate_items_estimate_id_fkey 
  FOREIGN KEY (estimate_id) 
  REFERENCES tenant.estimates(id) 
  ON DELETE CASCADE;

-- Add index for performance on the FK
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate_id 
  ON tenant.estimate_items(estimate_id);

-- End of migration
