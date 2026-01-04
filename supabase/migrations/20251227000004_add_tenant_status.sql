-- Add status column to tenant.tenants
ALTER TABLE tenant.tenants ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
