-- Add missing subtotal column to tenant.estimates
-- Keeps estimate maths simple: totals live on estimates + estimate_items

ALTER TABLE tenant.estimates
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) DEFAULT 0;

