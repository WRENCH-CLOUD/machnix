-- Add missing foreign key constraint for payment_transactions table
-- This fixes the Supabase join: payments:payment_transactions(*) not working

-- Add invoice_id foreign key to payment_transactions table
ALTER TABLE IF EXISTS tenant.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_invoice_id_fkey;
ALTER TABLE IF EXISTS tenant.payment_transactions 
  ADD CONSTRAINT payment_transactions_invoice_id_fkey 
  FOREIGN KEY (invoice_id) 
  REFERENCES tenant.invoices(id) 
  ON DELETE CASCADE;

-- Add tenant_id foreign key to payment_transactions table
ALTER TABLE IF EXISTS tenant.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_tenant_id_fkey;
ALTER TABLE IF EXISTS tenant.payment_transactions 
  ADD CONSTRAINT payment_transactions_tenant_id_fkey 
  FOREIGN KEY (tenant_id) 
  REFERENCES tenant.tenants(id) 
  ON DELETE CASCADE;
