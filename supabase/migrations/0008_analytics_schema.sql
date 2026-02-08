-- =============================================================================
-- 0008_analytics_schema.sql
-- Analytics schema for admin tracking (WhatsApp messages, etc.)
-- =============================================================================

-- Create analytics schema
CREATE SCHEMA IF NOT EXISTS analytics;

-- =============================================================================
-- WhatsApp Message Tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  job_id uuid,
  
  -- Message details
  customer_phone text NOT NULL,
  job_status text NOT NULL,
  vehicle_number text NOT NULL,
  message_id text,
  
  -- Delivery tracking
  delivery_status text NOT NULL DEFAULT 'pending',
  error_message text,
  
  -- Timestamps
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant_id 
  ON analytics.whatsapp_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_job_id 
  ON analytics.whatsapp_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_at 
  ON analytics.whatsapp_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_delivery_status 
  ON analytics.whatsapp_messages(delivery_status);

-- =============================================================================
-- RLS Policies - Admin Only
-- =============================================================================

ALTER TABLE analytics.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Platform admins can view all messages
CREATE POLICY whatsapp_messages_platform_admin_policy ON analytics.whatsapp_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

-- Service role bypass for API logging
CREATE POLICY whatsapp_messages_service_role_policy ON analytics.whatsapp_messages
  FOR ALL
  USING (auth.role() = 'service_role');

-- Tenant admins can view their own tenant's messages
CREATE POLICY whatsapp_messages_tenant_admin_policy ON analytics.whatsapp_messages
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin', 'admin')
  );

COMMENT ON TABLE analytics.whatsapp_messages IS 'Tracks all WhatsApp messages sent via Gupshup for analytics and debugging';
COMMENT ON SCHEMA analytics IS 'Analytics data for platform admins';
