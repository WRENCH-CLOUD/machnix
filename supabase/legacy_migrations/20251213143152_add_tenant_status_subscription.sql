-- Add status and subscription columns to tenants table for better querying
-- Instead of storing in JSONB metadata, use proper columns

-- Add status column with enum type
CREATE TYPE tenant.tenant_status AS ENUM ('active', 'suspended', 'trial', 'inactive');

ALTER TABLE tenant.tenants 
  ADD COLUMN IF NOT EXISTS status tenant.tenant_status DEFAULT 'active' NOT NULL;

-- Add subscription column with enum type  
CREATE TYPE tenant.subscription_tier AS ENUM ('starter', 'pro', 'enterprise');

ALTER TABLE tenant.tenants 
  ADD COLUMN IF NOT EXISTS subscription tenant.subscription_tier DEFAULT 'pro' NOT NULL;

-- Add subscription_status column for better tracking
ALTER TABLE tenant.tenants
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- Migrate existing data from metadata to columns if metadata has these fields
UPDATE tenant.tenants
SET 
  status = COALESCE((metadata->>'status')::tenant.tenant_status, 'active'),
  subscription = COALESCE((metadata->>'subscription')::tenant.subscription_tier, 'pro')
WHERE metadata IS NOT NULL 
  AND (metadata ? 'status' OR metadata ? 'subscription');

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenant.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription ON tenant.tenants(subscription);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenant.tenants(subscription_status);

-- Add comments for documentation
COMMENT ON COLUMN tenant.tenants.status IS 'Current operational status of the tenant';
COMMENT ON COLUMN tenant.tenants.subscription IS 'Subscription tier of the tenant';
COMMENT ON COLUMN tenant.tenants.subscription_status IS 'Subscription payment status (trial, active, cancelled, etc.)';
