-- Additional roles and ENUM values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'roles' AND e.enumlabel = 'frontdesk') THEN
    ALTER TYPE tenant.roles ADD VALUE 'frontdesk';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'roles' AND e.enumlabel = 'admin') THEN
    ALTER TYPE tenant.roles ADD VALUE 'admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'roles' AND e.enumlabel = 'employee') THEN
    ALTER TYPE tenant.roles ADD VALUE 'employee';
  END IF;
END
$$;
