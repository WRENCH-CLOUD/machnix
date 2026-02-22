-- =============================================================================
-- 0004_mechanics_improvements.sql
-- Add is_active, updated_at and auth_user_id to mechanics table
-- =============================================================================

-- Add is_active column for enabling/disabling mechanics
ALTER TABLE tenant.mechanics ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add updated_at column for tracking modifications
ALTER TABLE tenant.mechanics ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add auth_user_id column for future linking to auth.users (nullable for Phase 2)
ALTER TABLE tenant.mechanics ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_mechanics_updated_at ON tenant.mechanics;
CREATE TRIGGER update_mechanics_updated_at
  BEFORE UPDATE ON tenant.mechanics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for auth_user_id lookup (future use)
CREATE INDEX IF NOT EXISTS idx_mechanics_auth_user_id ON tenant.mechanics(auth_user_id);
