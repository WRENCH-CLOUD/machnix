-- Migration: Update payment transaction status from 'success' to 'completed'
-- This migration ensures consistency by replacing the legacy 'success' status with 'completed'

-- Update existing payment transactions with 'success' status to 'completed'
UPDATE tenant.payment_transactions
SET status = 'completed'
WHERE status = 'success';

-- Add comment to document the valid status values
COMMENT ON COLUMN tenant.payment_transactions.status IS 'Payment transaction status: initiated, completed, or failed';
