-- =============================================================================
-- REVERT: Drop gupshup_settings table and related objects
-- Run this SQL in Supabase dashboard to undo the gupshup migration
-- =============================================================================

-- Drop RLS Policies
DROP POLICY IF EXISTS gupshup_settings_select_policy ON tenant.gupshup_settings;
DROP POLICY IF EXISTS gupshup_settings_update_policy ON tenant.gupshup_settings;
DROP POLICY IF EXISTS gupshup_settings_insert_policy ON tenant.gupshup_settings;
DROP POLICY IF EXISTS gupshup_settings_service_role_policy ON tenant.gupshup_settings;

-- Drop Trigger
DROP TRIGGER IF EXISTS update_gupshup_settings_updated_at ON tenant.gupshup_settings;

-- Drop Index
DROP INDEX IF EXISTS tenant.idx_gupshup_settings_tenant_id;

-- Drop Table
DROP TABLE IF EXISTS tenant.gupshup_settings;

-- Verification: This should return no rows if successful
-- SELECT * FROM tenant.gupshup_settings;

COMMENT ON COLUMN tenant.settings.whatsapp_enabled IS 'Whether WhatsApp notifications are enabled for this tenant (uses platform-level Gupshup configuration)';
