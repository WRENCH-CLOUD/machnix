-- Grant service_role access to tenant schema tables for admin operations
-- This allows platform admin operations to bypass RLS when needed

-- Grant ALL privileges on all tables in tenant schema to service_role
GRANT ALL ON ALL TABLES IN SCHEMA tenant TO service_role;

-- Grant ALL privileges on all sequences in tenant schema to service_role
GRANT ALL ON ALL SEQUENCES IN SCHEMA tenant TO service_role;

-- Grant ALL privileges on all functions in tenant schema to service_role
GRANT ALL ON ALL ROUTINES IN SCHEMA tenant TO service_role;

-- Ensure future tables also get these grants
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant GRANT ALL ON ROUTINES TO service_role;
