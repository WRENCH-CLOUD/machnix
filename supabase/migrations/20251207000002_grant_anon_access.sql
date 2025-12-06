-- Grant full access to anon role for development (TEMPORARY - remove for production)
GRANT ALL ON tenant.invoices TO anon;
GRANT ALL ON tenant.invoice_items TO anon;
GRANT ALL ON tenant.estimates TO anon;
GRANT ALL ON tenant.estimate_items TO anon;
GRANT ALL ON tenant.part_usages TO anon;
GRANT ALL ON tenant.jobcards TO anon;
GRANT ALL ON tenant.customers TO anon;
GRANT ALL ON tenant.vehicles TO anon;
GRANT ALL ON tenant.payments TO anon;
GRANT ALL ON tenant.parts TO anon;
GRANT ALL ON tenant.mechanics TO anon;

-- Grant usage on schema
GRANT USAGE ON SCHEMA tenant TO anon;

-- Grant select on all tables in schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA tenant TO anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA tenant TO anon;
