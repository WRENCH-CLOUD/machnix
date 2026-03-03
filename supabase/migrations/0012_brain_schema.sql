-- =============================================================================
-- 0012_brain_schema.sql
-- The "Brain" Updates: Deep Schema, Priority Engine, and Automations
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. PUBLIC SCHEMA: Service Categories & Defaults
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- e.g., "Brake Pad Change" = 90 mins (Industry Standard Baselines)
CREATE TABLE IF NOT EXISTS public.service_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  baseline_time_minutes integer NOT NULL, -- The Zero-Data start
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, service_name)
);

-- -----------------------------------------------------------------------------
-- 2. TENANT SCHEMA: Mechanics & Skills
-- -----------------------------------------------------------------------------

-- Mechanic Work Status Enum
DO $$ BEGIN
  CREATE TYPE tenant.mechanic_status AS ENUM ('idle', 'working', 'waiting_for_part', 'on_leave');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update Mechanics table
ALTER TABLE tenant.mechanics 
  ADD COLUMN IF NOT EXISTS efficiency_score numeric(4,2) DEFAULT 1.0,  -- The feedback loop multiplier
  ADD COLUMN IF NOT EXISTS current_work_status tenant.mechanic_status DEFAULT 'idle';

-- Mechanic Skills mapping
CREATE TABLE IF NOT EXISTS tenant.mechanic_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenant.tenants(id) ON DELETE CASCADE,
  mechanic_id uuid NOT NULL REFERENCES tenant.mechanics(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  proficiency_level integer NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mechanic_id, category_id)
);

-- -----------------------------------------------------------------------------
-- 3. TENANT SCHEMA: Bays (Physical Slots)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenant.bays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenant.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  bay_type text NOT NULL, -- e.g., 'standard', 'heavy_lift'
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- -----------------------------------------------------------------------------
-- 4. TENANT SCHEMA: Jobcards (Urgency / Deadlines)
-- -----------------------------------------------------------------------------

ALTER TABLE tenant.jobcards
  ADD COLUMN IF NOT EXISTS is_waiting_on_site boolean NOT NULL DEFAULT false, -- Hormozi Tip: Customer in lobby
  ADD COLUMN IF NOT EXISTS promised_delivery_time timestamptz,                -- External promise to customer
  ADD COLUMN IF NOT EXISTS soft_deadline timestamptz,                         -- Internal goal
  ADD COLUMN IF NOT EXISTS hard_deadline timestamptz;                         -- Spikes priority as it approaches

-- -----------------------------------------------------------------------------
-- 5. TENANT SCHEMA: Job Card Tasks (Requirements & Scoring)
-- -----------------------------------------------------------------------------

ALTER TABLE tenant.job_card_tasks
  ADD COLUMN IF NOT EXISTS service_category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS required_skill_level integer CHECK (required_skill_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS required_bay_type text,
  ADD COLUMN IF NOT EXISTS priority_score numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_time_minutes integer,
  ADD COLUMN IF NOT EXISTS actual_time_minutes integer;

-- -----------------------------------------------------------------------------
-- RLS Policies & Indexes
-- -----------------------------------------------------------------------------

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mechanic_skills_tenant ON tenant.mechanic_skills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mechanic_skills_mechanic ON tenant.mechanic_skills(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_bays_tenant ON tenant.bays(tenant_id);

-- RLS for Mechanic Skills
ALTER TABLE tenant.mechanic_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY mechanic_skills_select ON tenant.mechanic_skills FOR SELECT USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY mechanic_skills_insert ON tenant.mechanic_skills FOR INSERT WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY mechanic_skills_update ON tenant.mechanic_skills FOR UPDATE USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id()) WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY mechanic_skills_delete ON tenant.mechanic_skills FOR DELETE USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

-- RLS for Bays
ALTER TABLE tenant.bays ENABLE ROW LEVEL SECURITY;
CREATE POLICY bays_select ON tenant.bays FOR SELECT USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY bays_insert ON tenant.bays FOR INSERT WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY bays_update ON tenant.bays FOR UPDATE USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id()) WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY bays_delete ON tenant.bays FOR DELETE USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

COMMIT;
