-- Hotfix: Ensure all inventory_items columns exist
-- These columns should exist from 0001_base_schema.sql (parts table renamed to inventory_items)
-- but may be missing if the table was created separately or migration ran partially

ALTER TABLE tenant.inventory_items
  ADD COLUMN IF NOT EXISTS stock_keeping_unit text;

ALTER TABLE tenant.inventory_items
  ADD COLUMN IF NOT EXISTS unit_cost numeric(12,2) DEFAULT 0;

ALTER TABLE tenant.inventory_items
  ADD COLUMN IF NOT EXISTS sell_price numeric(12,2) DEFAULT 0;

ALTER TABLE tenant.inventory_items
  ADD COLUMN IF NOT EXISTS reorder_level integer DEFAULT 0;

ALTER TABLE tenant.inventory_items
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE tenant.inventory_items
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE tenant.inventory_items
  ADD COLUMN IF NOT EXISTS deleted_by uuid;
