-- Add missing foreign key constraints
-- This fixes the error: "Could not find a relationship between 'jobcards' and 'mechanics' in the schema cache"

-- Add tenant_id foreign key to mechanics table
ALTER TABLE IF EXISTS tenant.mechanics DROP CONSTRAINT IF EXISTS mechanics_tenant_id_fkey;
ALTER TABLE IF EXISTS tenant.mechanics 
  ADD CONSTRAINT mechanics_tenant_id_fkey 
  FOREIGN KEY (tenant_id) 
  REFERENCES tenant.tenants(id) 
  ON DELETE CASCADE;

-- Add assigned_mechanic_id foreign key to jobcards table
ALTER TABLE IF EXISTS tenant.jobcards DROP CONSTRAINT IF EXISTS jobcards_assigned_mechanic_id_fkey;
ALTER TABLE IF EXISTS tenant.jobcards 
  ADD CONSTRAINT jobcards_assigned_mechanic_id_fkey 
  FOREIGN KEY (assigned_mechanic_id) 
  REFERENCES tenant.mechanics(id) 
  ON DELETE SET NULL;

-- Add invoice_id foreign key to payments table
ALTER TABLE IF EXISTS tenant.payments DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey;
ALTER TABLE IF EXISTS tenant.payments 
  ADD CONSTRAINT payments_invoice_id_fkey 
  FOREIGN KEY (invoice_id) 
  REFERENCES tenant.invoices(id) 
  ON DELETE RESTRICT;

-- Add tenant_id foreign key to parts table
ALTER TABLE IF EXISTS tenant.parts DROP CONSTRAINT IF EXISTS parts_tenant_id_fkey;
ALTER TABLE IF EXISTS tenant.parts 
  ADD CONSTRAINT parts_tenant_id_fkey 
  FOREIGN KEY (tenant_id) 
  REFERENCES tenant.tenants(id) 
  ON DELETE CASCADE;

-- Add tenant_id foreign key to part_usages table
ALTER TABLE IF EXISTS tenant.part_usages DROP CONSTRAINT IF EXISTS part_usages_tenant_id_fkey;
ALTER TABLE IF EXISTS tenant.part_usages 
  ADD CONSTRAINT part_usages_tenant_id_fkey 
  FOREIGN KEY (tenant_id) 
  REFERENCES tenant.tenants(id) 
  ON DELETE CASCADE;

-- Add jobcard_id foreign key to part_usages table
ALTER TABLE IF EXISTS tenant.part_usages DROP CONSTRAINT IF EXISTS part_usages_jobcard_id_fkey;
ALTER TABLE IF EXISTS tenant.part_usages 
  ADD CONSTRAINT part_usages_jobcard_id_fkey 
  FOREIGN KEY (jobcard_id) 
  REFERENCES tenant.jobcards(id) 
  ON DELETE CASCADE;

-- Add part_id foreign key to part_usages table
ALTER TABLE IF EXISTS tenant.part_usages DROP CONSTRAINT IF EXISTS part_usages_part_id_fkey;
ALTER TABLE IF EXISTS tenant.part_usages 
  ADD CONSTRAINT part_usages_part_id_fkey 
  FOREIGN KEY (part_id) 
  REFERENCES tenant.parts(id) 
  ON DELETE RESTRICT;

-- Add tenant_id foreign key to estimates table
ALTER TABLE IF EXISTS tenant.estimates DROP CONSTRAINT IF EXISTS estimates_tenant_id_fkey;
ALTER TABLE IF EXISTS tenant.estimates 
  ADD CONSTRAINT estimates_tenant_id_fkey 
  FOREIGN KEY (tenant_id) 
  REFERENCES tenant.tenants(id) 
  ON DELETE CASCADE;

-- Add jobcard_id foreign key to estimates table
ALTER TABLE IF EXISTS tenant.estimates DROP CONSTRAINT IF EXISTS estimates_jobcard_id_fkey;
ALTER TABLE IF EXISTS tenant.estimates 
  ADD CONSTRAINT estimates_jobcard_id_fkey 
  FOREIGN KEY (jobcard_id) 
  REFERENCES tenant.jobcards(id) 
  ON DELETE SET NULL;

-- Add customer_id foreign key to estimates table
ALTER TABLE IF EXISTS tenant.estimates DROP CONSTRAINT IF EXISTS estimates_customer_id_fkey;
ALTER TABLE IF EXISTS tenant.estimates 
  ADD CONSTRAINT estimates_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES tenant.customers(id) 
  ON DELETE RESTRICT;

-- Add vehicle_id foreign key to estimates table
ALTER TABLE IF EXISTS tenant.estimates DROP CONSTRAINT IF EXISTS estimates_vehicle_id_fkey;
ALTER TABLE IF EXISTS tenant.estimates 
  ADD CONSTRAINT estimates_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) 
  REFERENCES tenant.vehicles(id) 
  ON DELETE RESTRICT;

-- Add tenant_id foreign key to invoices table
ALTER TABLE IF EXISTS tenant.invoices DROP CONSTRAINT IF EXISTS invoices_tenant_id_fkey;
ALTER TABLE IF EXISTS tenant.invoices 
  ADD CONSTRAINT invoices_tenant_id_fkey 
  FOREIGN KEY (tenant_id) 
  REFERENCES tenant.tenants(id) 
  ON DELETE CASCADE;

-- Add jobcard_id foreign key to invoices table
ALTER TABLE IF EXISTS tenant.invoices DROP CONSTRAINT IF EXISTS invoices_jobcard_id_fkey;
ALTER TABLE IF EXISTS tenant.invoices 
  ADD CONSTRAINT invoices_jobcard_id_fkey 
  FOREIGN KEY (jobcard_id) 
  REFERENCES tenant.jobcards(id) 
  ON DELETE SET NULL;

-- Add estimate_id foreign key to invoices table
ALTER TABLE IF EXISTS tenant.invoices DROP CONSTRAINT IF EXISTS invoices_estimate_id_fkey;
ALTER TABLE IF EXISTS tenant.invoices 
  ADD CONSTRAINT invoices_estimate_id_fkey 
  FOREIGN KEY (estimate_id) 
  REFERENCES tenant.estimates(id) 
  ON DELETE SET NULL;

-- Add customer_id foreign key to invoices table
ALTER TABLE IF EXISTS tenant.invoices DROP CONSTRAINT IF EXISTS invoices_customer_id_fkey;
ALTER TABLE IF EXISTS tenant.invoices 
  ADD CONSTRAINT invoices_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES tenant.customers(id) 
  ON DELETE RESTRICT;

-- Add tenant_id foreign key to payments table
ALTER TABLE IF EXISTS tenant.payments DROP CONSTRAINT IF EXISTS payments_tenant_id_fkey;
ALTER TABLE IF EXISTS tenant.payments 
  ADD CONSTRAINT payments_tenant_id_fkey 
  FOREIGN KEY (tenant_id) 
  REFERENCES tenant.tenants(id) 
  ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_mechanics_tenant_id ON tenant.mechanics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobcards_assigned_mechanic_id ON tenant.jobcards(assigned_mechanic_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON tenant.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_part_usages_jobcard_id ON tenant.part_usages(jobcard_id);
CREATE INDEX IF NOT EXISTS idx_part_usages_part_id ON tenant.part_usages(part_id);
CREATE INDEX IF NOT EXISTS idx_estimates_jobcard_id ON tenant.estimates(jobcard_id);
CREATE INDEX IF NOT EXISTS idx_estimates_customer_id ON tenant.estimates(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_jobcard_id ON tenant.invoices(jobcard_id);
CREATE INDEX IF NOT EXISTS idx_invoices_estimate_id ON tenant.invoices(estimate_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON tenant.invoices(customer_id);

-- Add RLS policies for mechanics table (if not already present)
DROP POLICY IF EXISTS mechanics_select ON tenant.mechanics;
CREATE POLICY mechanics_select ON tenant.mechanics FOR SELECT
  USING ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text);

DROP POLICY IF EXISTS mechanics_insert ON tenant.mechanics;
CREATE POLICY mechanics_insert ON tenant.mechanics FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text);

DROP POLICY IF EXISTS mechanics_update ON tenant.mechanics;
CREATE POLICY mechanics_update ON tenant.mechanics FOR UPDATE
  USING ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text)
  WITH CHECK ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text);

DROP POLICY IF EXISTS mechanics_delete ON tenant.mechanics;
CREATE POLICY mechanics_delete ON tenant.mechanics FOR DELETE
  USING ((auth.jwt() ->> 'role') IN ('service_role','platform_admin') OR (auth.jwt() ->> 'tenant_id') = tenant_id::text);
