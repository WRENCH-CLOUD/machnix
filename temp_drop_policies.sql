-- Drop all RLS policies
DROP POLICY IF EXISTS tenant_isolation_select ON tenant.invoices;
DROP POLICY IF EXISTS tenant_isolation_insert ON tenant.invoices;
DROP POLICY IF EXISTS tenant_isolation_update ON tenant.invoices;
DROP POLICY IF EXISTS tenant_isolation_delete ON tenant.invoices;
DROP POLICY IF EXISTS "Tenant isolation" ON tenant.invoices;

DROP POLICY IF EXISTS tenant_isolation_select ON tenant.customers;
DROP POLICY IF EXISTS tenant_isolation_insert ON tenant.customers;
DROP POLICY IF EXISTS tenant_isolation_update ON tenant.customers;
DROP POLICY IF EXISTS tenant_isolation_delete ON tenant.customers;

DROP POLICY IF EXISTS tenant_isolation_select ON tenant.jobcards;
DROP POLICY IF EXISTS tenant_isolation_insert ON tenant.jobcards;
DROP POLICY IF EXISTS tenant_isolation_update ON tenant.jobcards;
DROP POLICY IF EXISTS tenant_isolation_delete ON tenant.jobcards;

DROP POLICY IF EXISTS tenant_isolation_select ON tenant.payments;
DROP POLICY IF EXISTS tenant_isolation_insert ON tenant.payments;
DROP POLICY IF EXISTS tenant_isolation_update ON tenant.payments;
DROP POLICY IF EXISTS tenant_isolation_delete ON tenant.payments;
