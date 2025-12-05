-- =====================================================
-- SUPABASE PERMISSIONS CONFIGURATION
-- =====================================================
-- Grant necessary permissions for anon and authenticated roles
-- to access the public and tenant schemas
-- =====================================================

-- =====================================================
-- SCHEMA LEVEL PERMISSIONS
-- =====================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA tenant TO anon, authenticated;

-- =====================================================
-- PUBLIC SCHEMA PERMISSIONS (Read-only reference data)
-- =====================================================

-- Grant SELECT on public schema tables (vehicle makes/models)
GRANT SELECT ON public.schema_migrations TO anon, authenticated;
GRANT SELECT ON public.vehicle_category TO anon, authenticated;
GRANT SELECT ON public.vehicle_make TO anon, authenticated;
GRANT SELECT ON public.vehicle_model TO anon, authenticated;

-- =====================================================
-- TENANT SCHEMA PERMISSIONS (Full CRUD access)
-- =====================================================

-- Core tenant tables
GRANT ALL ON tenant.tenants TO anon, authenticated;
GRANT ALL ON tenant.users TO anon, authenticated;
GRANT ALL ON tenant.customers TO anon, authenticated;
GRANT ALL ON tenant.vehicles TO anon, authenticated;
GRANT ALL ON tenant.mechanics TO anon, authenticated;
GRANT ALL ON tenant.settings TO anon, authenticated;

-- Job card management
GRANT ALL ON tenant.jobcards TO anon, authenticated;
GRANT ALL ON tenant.activities TO anon, authenticated;

-- DVI (Digital Vehicle Inspection)
GRANT ALL ON tenant.dvi_templates TO anon, authenticated;
GRANT ALL ON tenant.dvi_checkpoint_categories TO anon, authenticated;
GRANT ALL ON tenant.dvi_checkpoints TO anon, authenticated;
GRANT ALL ON tenant.dvi_items TO anon, authenticated;
GRANT ALL ON tenant.dvi_photos TO anon, authenticated;

-- Estimates and invoices
GRANT ALL ON tenant.estimates TO anon, authenticated;
GRANT ALL ON tenant.estimate_items TO anon, authenticated;
GRANT ALL ON tenant.invoices TO anon, authenticated;

-- Parts and inventory
GRANT ALL ON tenant.parts TO anon, authenticated;
GRANT ALL ON tenant.part_usages TO anon, authenticated;
GRANT ALL ON tenant.inventory_transactions TO anon, authenticated;

-- Payments
GRANT ALL ON tenant.payments TO anon, authenticated;
GRANT ALL ON tenant.payment_transactions TO anon, authenticated;
GRANT ALL ON tenant.razorpay_settings TO anon, authenticated;

-- Communications and notifications
GRANT ALL ON tenant.customer_communications TO anon, authenticated;
GRANT ALL ON tenant.notifications TO anon, authenticated;

-- =====================================================
-- SEQUENCES PERMISSIONS
-- =====================================================

-- Grant usage and select on all sequences in both schemas
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA tenant TO anon, authenticated;

-- =====================================================
-- DEFAULT PRIVILEGES FOR FUTURE OBJECTS
-- =====================================================

-- Set default privileges for any future tables created in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO anon, authenticated;

-- Set default privileges for any future tables created in tenant schema
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant 
GRANT ALL ON TABLES TO anon, authenticated;

-- Set default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA tenant 
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- =====================================================
-- IMPORTANT SECURITY NOTES
-- =====================================================
-- 
-- WARNING: This script grants broad permissions for development.
-- For PRODUCTION, you MUST implement Row Level Security (RLS)!
-- 
-- Next steps for production:
-- 1. Enable RLS on all tenant schema tables:
--    ALTER TABLE tenant.tablename ENABLE ROW LEVEL SECURITY;
-- 
-- 2. Create RLS policies to enforce tenant isolation:
--    Example policy for tenant isolation:
--    CREATE POLICY "Users can only access their tenant data"
--    ON tenant.customers
--    FOR ALL
--    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
-- 
-- 3. Consider creating specific policies for different operations:
--    - SELECT policies for read access
--    - INSERT policies for create access
--    - UPDATE policies for modify access
--    - DELETE policies for remove access
-- 
-- 4. Review and restrict permissions based on user roles
-- 
-- =====================================================

