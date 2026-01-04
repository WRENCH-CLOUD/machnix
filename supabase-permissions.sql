-- =====================================================
-- SUPABASE PERMISSIONS CONFIGURATION
-- =====================================================
-- Grant necessary permissions for authenticated role
-- to access the public and tenant schemas
-- 
-- SECURITY: The anon role should NOT have access to tenant data.
-- All tenant data access requires authentication and is protected by RLS.
-- =====================================================

-- =====================================================
-- SCHEMA LEVEL PERMISSIONS
-- =====================================================

-- Grant usage on schemas
-- anon can only access public schema for login/reference data
GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- Only authenticated users can access tenant schema
GRANT USAGE ON SCHEMA tenant TO authenticated;

-- =====================================================
-- PUBLIC SCHEMA PERMISSIONS (Read-only reference data)
-- =====================================================

-- Grant SELECT on public schema tables (vehicle makes/models)
-- These are safe for anon as they contain no tenant data
GRANT SELECT ON public.schema_migrations TO anon, authenticated;
GRANT SELECT ON public.vehicle_category TO anon, authenticated;
GRANT SELECT ON public.vehicle_make TO anon, authenticated;
GRANT SELECT ON public.vehicle_model TO anon, authenticated;

-- =====================================================
-- TENANT SCHEMA PERMISSIONS (Authenticated users only)
-- =====================================================
-- SECURITY: Only authenticated users can access tenant tables.
-- RLS policies provide additional tenant isolation.

-- Core tenant tables
GRANT ALL ON tenant.tenants TO authenticated;
GRANT ALL ON tenant.users TO authenticated;
GRANT ALL ON tenant.customers TO authenticated;
GRANT ALL ON tenant.vehicles TO authenticated;
GRANT ALL ON tenant.mechanics TO authenticated;
GRANT ALL ON tenant.settings TO authenticated;

-- Job card management
GRANT ALL ON tenant.jobcards TO authenticated;
GRANT ALL ON tenant.activities TO authenticated;

-- DVI (Digital Vehicle Inspection)
GRANT ALL ON tenant.dvi_templates TO authenticated;
GRANT ALL ON tenant.dvi_checkpoint_categories TO authenticated;
GRANT ALL ON tenant.dvi_checkpoints TO authenticated;
GRANT ALL ON tenant.dvi_items TO authenticated;
GRANT ALL ON tenant.dvi_photos TO authenticated;

-- Estimates and invoices
GRANT ALL ON tenant.estimates TO authenticated;
GRANT ALL ON tenant.estimate_items TO authenticated;
GRANT ALL ON tenant.invoices TO authenticated;

-- Parts and inventory
GRANT ALL ON tenant.parts TO authenticated;
GRANT ALL ON tenant.part_usages TO authenticated;
GRANT ALL ON tenant.inventory_transactions TO authenticated;

-- Payments
GRANT ALL ON tenant.payments TO authenticated;
GRANT ALL ON tenant.payment_transactions TO authenticated;
GRANT ALL ON tenant.razorpay_settings TO authenticated;

-- Counters and analytics
GRANT ALL ON tenant.counters TO authenticated;
GRANT ALL ON tenant.monthly_analytics TO authenticated;

-- Communications and notifications
GRANT ALL ON tenant.notifications TO authenticated;

-- =====================================================
-- SEQUENCES PERMISSIONS
-- =====================================================

-- Grant usage and select on all sequences in both schemas
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
-- Only authenticated users can use tenant sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA tenant TO authenticated;

-- =====================================================
-- DEFAULT PRIVILEGES FOR FUTURE OBJECTS
-- =====================================================

-- Set default privileges for any future tables created in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO anon, authenticated;

-- Set default privileges for any future tables created in tenant schema
-- SECURITY: Only authenticated users get access to new tenant tables
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant 
GRANT ALL ON TABLES TO authenticated;

-- Set default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA tenant 
GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- =====================================================
-- SECURITY NOTES
-- =====================================================
-- 
-- This script is PRODUCTION-READY with the following security measures:
-- 
-- 1. The 'anon' role cannot access tenant schema tables
--    - Prevents unauthenticated access to sensitive data
--    - Only public reference data (vehicle makes/models) is accessible
-- 
-- 2. All tenant tables have Row Level Security (RLS) enabled
--    - See migrations for RLS policy definitions
--    - Policies enforce tenant isolation via JWT tenant_id claim
-- 
-- 3. Role-based access control via JWT claims
--    - service_role: Full bypass (backend services only)
--    - platform_admin: Cross-tenant access for admins
--    - tenant/admin/frontdesk: Tenant-scoped access
--    - mechanic: Limited read access to assigned jobs
-- 
-- =====================================================

