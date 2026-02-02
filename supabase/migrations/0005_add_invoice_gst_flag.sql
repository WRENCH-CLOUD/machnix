-- =============================================================================
-- 0005_add_invoice_gst_flag.sql
-- Add is_gst_billed and discount_percentage columns to invoices table
-- =============================================================================

-- Add is_gst_billed column (default true for backward compatibility)
-- Existing invoices will be treated as GST invoices
ALTER TABLE tenant.invoices 
ADD COLUMN IF NOT EXISTS is_gst_billed boolean NOT NULL DEFAULT true;

-- Add discount_percentage column (default 0 means no discount)
ALTER TABLE tenant.invoices 
ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2) NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN tenant.invoices.is_gst_billed IS 'Whether GST (18%) was applied to this invoice. True = Tax Invoice, False = Bill of Supply';
COMMENT ON COLUMN tenant.invoices.discount_percentage IS 'Discount percentage applied to subtotal before tax calculation. 0 means no discount.';
-- =============================================================================
-- 0006_add_mechanics_is_active.sql
-- Add is_active and updated_at columns to mechanics table
-- =============================================================================

-- Add is_active column (default true for all existing mechanics)
ALTER TABLE tenant.mechanics 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add updated_at column if missing
ALTER TABLE tenant.mechanics 
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add auth_user_id column for linking to auth.users
ALTER TABLE tenant.mechanics 
ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Add comment for documentation
COMMENT ON COLUMN tenant.mechanics.is_active IS 'Whether mechanic is currently active and can be assigned to jobs';
