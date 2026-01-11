-- Add status column to tenant.tenants
CREATE TYPE tenant.tenant_status AS ENUM ('active', 'trial', 'inactive', 'suspended');
ALTER TABLE tenant.tenants ADD COLUMN IF NOT EXISTS status tenant.tenant_status DEFAULT 'active';