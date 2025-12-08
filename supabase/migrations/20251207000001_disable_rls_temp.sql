-- Temporarily disable RLS for development/integration testing
-- Re-enable these after integration is complete

ALTER TABLE tenant.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.estimates DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.estimate_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.part_usages DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.jobcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.payments DISABLE ROW LEVEL SECURITY;
