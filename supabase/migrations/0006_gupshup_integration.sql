-- =============================================================================
-- 0006_gupshup_integration.sql
-- Gupshup WhatsApp integration settings per tenant
-- =============================================================================

-- Gupshup Settings (per-tenant phone number configuration)
CREATE TABLE IF NOT EXISTS tenant.gupshup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE,
  
  -- Per-tenant config (platform credentials stored in env vars)
  source_number text NOT NULL,        -- Tenant's assigned WABA phone number
  
  -- Configuration
  is_active boolean NOT NULL DEFAULT false,
  trigger_mode text NOT NULL DEFAULT 'manual' CHECK (trigger_mode IN ('auto', 'manual', 'both')),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT gupshup_settings_tenant_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE
);

-- Index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_gupshup_settings_tenant_id 
  ON tenant.gupshup_settings(tenant_id);

-- Updated at trigger
DROP TRIGGER IF EXISTS update_gupshup_settings_updated_at ON tenant.gupshup_settings;
CREATE TRIGGER update_gupshup_settings_updated_at
  BEFORE UPDATE ON tenant.gupshup_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE tenant.gupshup_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own tenant's settings
CREATE POLICY gupshup_settings_select_policy ON tenant.gupshup_settings
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Only tenant owners/admins can update
CREATE POLICY gupshup_settings_update_policy ON tenant.gupshup_settings
  FOR UPDATE
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin', 'admin')
  );

-- Only tenant owners/admins can insert
CREATE POLICY gupshup_settings_insert_policy ON tenant.gupshup_settings
  FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin', 'admin')
  );

-- Service role bypass
CREATE POLICY gupshup_settings_service_role_policy ON tenant.gupshup_settings
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE tenant.gupshup_settings IS 'Per-tenant Gupshup WhatsApp configuration. Platform credentials stored in env vars.';
