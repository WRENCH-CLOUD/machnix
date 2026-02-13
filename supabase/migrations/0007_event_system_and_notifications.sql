-- =============================================================================
-- 0007_event_system_and_notifications.sql
-- Decentralised Event System + Cross-Schema Notification Architecture
--
-- Architecture:
--   analytics.event_logs    → central event bus (write-ahead log)
--   public.notifications    → platform-admin notifications
--   tenant.notifications    → already exists (enhanced below)
--   analytics.event_dead_letter → failed event processing quarantine
--
-- Principles:
--   - No direct writes from tenant schema to analytics aggregates
--   - All cross-schema communication goes through analytics.event_logs
--   - Event processor is the sole writer to analytics summary tables
--   - Idempotent processing via idempotency_key + processed_at gating
-- =============================================================================

-- Ensure analytics schema exists
CREATE SCHEMA IF NOT EXISTS analytics;

-- =============================================================================
-- 1. ANALYTICS EVENT LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics.event_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      text NOT NULL,                    -- e.g. 'job.created', 'invoice.generated', 'payment.received'
  tenant_id       uuid NOT NULL,                    -- source tenant
  entity_type     text NOT NULL,                    -- e.g. 'jobcard', 'invoice', 'payment', 'subscription'
  entity_id       uuid NOT NULL,                    -- PK of the source entity
  actor_id        uuid,                             -- user who triggered the event (nullable for system events)
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb, -- event-specific data snapshot
  idempotency_key text UNIQUE,                      -- prevents duplicate event processing
  retry_count     int NOT NULL DEFAULT 0,           -- number of processing attempts
  max_retries     int NOT NULL DEFAULT 5,           -- circuit breaker threshold
  error_message   text,                             -- last processing error
  created_at      timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz,                      -- NULL = unprocessed
  
  CONSTRAINT event_logs_tenant_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE CASCADE
);

-- Composite index: fast unprocessed event polling (the hot path)
CREATE INDEX IF NOT EXISTS idx_event_logs_unprocessed
  ON analytics.event_logs (created_at ASC)
  WHERE processed_at IS NULL;

-- Tenant scoped queries
CREATE INDEX IF NOT EXISTS idx_event_logs_tenant_id
  ON analytics.event_logs (tenant_id, created_at DESC);

-- Event type filtering
CREATE INDEX IF NOT EXISTS idx_event_logs_event_type
  ON analytics.event_logs (event_type, created_at DESC);

-- Entity lookup (find all events for a specific entity)
CREATE INDEX IF NOT EXISTS idx_event_logs_entity
  ON analytics.event_logs (entity_type, entity_id);

-- Idempotency key uniqueness is enforced by the UNIQUE constraint above

-- =============================================================================
-- 2. DEAD LETTER QUEUE (failed events after max retries)
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics.event_dead_letter (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id uuid NOT NULL REFERENCES analytics.event_logs(id),
  event_type      text NOT NULL,
  tenant_id       uuid NOT NULL,
  entity_type     text NOT NULL,
  entity_id       uuid NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message   text,
  retry_count     int NOT NULL DEFAULT 0,
  failed_at       timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,                      -- manual resolution timestamp
  resolution_note text                              -- admin notes on resolution
);

CREATE INDEX IF NOT EXISTS idx_event_dead_letter_unresolved
  ON analytics.event_dead_letter (failed_at ASC)
  WHERE resolved_at IS NULL;

-- =============================================================================
-- 3. PUBLIC NOTIFICATIONS TABLE (for platform superadmin)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id    uuid,                             -- platform_admin user id (nullable for broadcast)
  tenant_id       uuid,                             -- related tenant (nullable for global)
  title           text NOT NULL,
  message         text NOT NULL,
  category        text NOT NULL DEFAULT 'system',   -- 'system', 'billing', 'alert', 'tenant_activity'
  severity        text NOT NULL DEFAULT 'info',     -- 'info', 'warning', 'error', 'critical'
  entity_type     text,                             -- reference linking: 'tenant', 'subscription', etc.
  entity_id       uuid,                             -- reference linking: PK of related entity
  source_event_id uuid,                             -- trace back to originating event
  is_read         boolean NOT NULL DEFAULT false,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_notifications_recipient
  ON public.notifications (recipient_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_notifications_unread
  ON public.notifications (created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_public_notifications_tenant
  ON public.notifications (tenant_id, created_at DESC);

-- =============================================================================
-- 4. ENHANCE EXISTING TENANT NOTIFICATIONS
-- Add missing columns for event-driven architecture support
-- =============================================================================

-- Add source_event_id to link tenant notifications back to the originating event
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'tenant'
      AND table_name = 'notifications'
      AND column_name = 'source_event_id'
  ) THEN
    ALTER TABLE tenant.notifications ADD COLUMN source_event_id uuid;
  END IF;
END $$;

-- Add severity column for priority-based filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'tenant'
      AND table_name = 'notifications'
      AND column_name = 'severity'
  ) THEN
    ALTER TABLE tenant.notifications ADD COLUMN severity text NOT NULL DEFAULT 'info';
  END IF;
END $$;

-- Add title column for richer notification display
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'tenant'
      AND table_name = 'notifications'
      AND column_name = 'title'
  ) THEN
    ALTER TABLE tenant.notifications ADD COLUMN title text;
  END IF;
END $$;

-- Add message column for human-readable notification text
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'tenant'
      AND table_name = 'notifications'
      AND column_name = 'message'
  ) THEN
    ALTER TABLE tenant.notifications ADD COLUMN message text;
  END IF;
END $$;

-- Add optimised indexes for tenant notification queries
CREATE INDEX IF NOT EXISTS idx_tenant_notifications_user_unread
  ON tenant.notifications (user_id, is_read, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenant_notifications_tenant_unread
  ON tenant.notifications (tenant_id, is_read, created_at DESC);

-- =============================================================================
-- 5. EVENT PUBLISHING FUNCTION (PostgreSQL trigger-based publisher)
-- =============================================================================

-- Generic event publishing function called by triggers
CREATE OR REPLACE FUNCTION analytics.publish_event(
  p_event_type    text,
  p_tenant_id     uuid,
  p_entity_type   text,
  p_entity_id     uuid,
  p_actor_id      uuid DEFAULT NULL,
  p_payload       jsonb DEFAULT '{}'::jsonb,
  p_idempotency_key text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id uuid;
  v_idem_key text;
BEGIN
  -- Generate idempotency key if not provided
  v_idem_key := COALESCE(
    p_idempotency_key,
    p_event_type || ':' || p_entity_id::text || ':' || extract(epoch from now())::text
  );

  INSERT INTO analytics.event_logs (
    event_type, tenant_id, entity_type, entity_id,
    actor_id, payload, idempotency_key
  )
  VALUES (
    p_event_type, p_tenant_id, p_entity_type, p_entity_id,
    p_actor_id, p_payload, v_idem_key
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- =============================================================================
-- 6. AUTOMATIC TRIGGERS FOR KEY TENANT EVENTS
-- =============================================================================

-- 6a. Job Card Created
CREATE OR REPLACE FUNCTION analytics.on_jobcard_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM analytics.publish_event(
    'job.created',
    NEW.tenant_id,
    'jobcard',
    NEW.id,
    NEW.created_by,
    jsonb_build_object(
      'job_number', NEW.job_number,
      'status', NEW.status,
      'customer_id', NEW.customer_id,
      'vehicle_id', NEW.vehicle_id,
      'assigned_mechanic_id', NEW.assigned_mechanic_id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jobcard_created ON tenant.jobcards;
CREATE TRIGGER trg_jobcard_created
  AFTER INSERT ON tenant.jobcards
  FOR EACH ROW
  EXECUTE FUNCTION analytics.on_jobcard_created();

-- 6b. Job Card Status Changed
CREATE OR REPLACE FUNCTION analytics.on_jobcard_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM analytics.publish_event(
      'job.status_changed',
      NEW.tenant_id,
      'jobcard',
      NEW.id,
      NULL,
      jsonb_build_object(
        'job_number', NEW.job_number,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'customer_id', NEW.customer_id,
        'vehicle_id', NEW.vehicle_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jobcard_status_changed ON tenant.jobcards;
CREATE TRIGGER trg_jobcard_status_changed
  AFTER UPDATE ON tenant.jobcards
  FOR EACH ROW
  EXECUTE FUNCTION analytics.on_jobcard_status_changed();

-- 6c. Invoice Generated
CREATE OR REPLACE FUNCTION analytics.on_invoice_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM analytics.publish_event(
    'invoice.generated',
    NEW.tenant_id,
    'invoice',
    NEW.id,
    NEW.created_by,
    jsonb_build_object(
      'invoice_number', NEW.invoice_number,
      'customer_id', NEW.customer_id,
      'total_amount', NEW.total_amount,
      'status', NEW.status,
      'jobcard_id', NEW.jobcard_id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_created ON tenant.invoices;
CREATE TRIGGER trg_invoice_created
  AFTER INSERT ON tenant.invoices
  FOR EACH ROW
  EXECUTE FUNCTION analytics.on_invoice_created();

-- 6d. Payment Received
CREATE OR REPLACE FUNCTION analytics.on_payment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM analytics.publish_event(
    'payment.received',
    NEW.tenant_id,
    'payment',
    NEW.id,
    NULL,
    jsonb_build_object(
      'invoice_id', NEW.invoice_id,
      'amount', NEW.amount,
      'payment_method', NEW.payment_method,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_created ON tenant.payments;
CREATE TRIGGER trg_payment_created
  AFTER INSERT ON tenant.payments
  FOR EACH ROW
  EXECUTE FUNCTION analytics.on_payment_created();

-- 6e. Subscription / Tenant Status Changes
CREATE OR REPLACE FUNCTION analytics.on_tenant_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Subscription tier change
  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier THEN
    PERFORM analytics.publish_event(
      'subscription.changed',
      NEW.id,
      'tenant',
      NEW.id,
      NULL,
      jsonb_build_object(
        'old_tier', OLD.subscription_tier,
        'new_tier', NEW.subscription_tier,
        'tenant_name', NEW.name
      )
    );
  END IF;

  -- Tenant status change (active → suspended, etc.)
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM analytics.publish_event(
      'tenant.status_changed',
      NEW.id,
      'tenant',
      NEW.id,
      NULL,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'tenant_name', NEW.name
      )
    );
  END IF;

  -- Subscription expiry approaching (within 7 days)
  IF NEW.subscription_end IS NOT NULL
     AND NEW.subscription_end <= (now() + interval '7 days')
     AND (OLD.subscription_end IS NULL OR OLD.subscription_end != NEW.subscription_end)
  THEN
    PERFORM analytics.publish_event(
      'subscription.expiring',
      NEW.id,
      'tenant',
      NEW.id,
      NULL,
      jsonb_build_object(
        'tenant_name', NEW.name,
        'subscription_tier', NEW.subscription_tier,
        'subscription_end', NEW.subscription_end
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenant_status_changed ON tenant.tenants;
CREATE TRIGGER trg_tenant_status_changed
  AFTER UPDATE ON tenant.tenants
  FOR EACH ROW
  EXECUTE FUNCTION analytics.on_tenant_status_changed();

-- =============================================================================
-- 7. RLS POLICIES
-- =============================================================================

-- Analytics event_logs: service-role only (no direct user access)
ALTER TABLE analytics.event_logs ENABLE ROW LEVEL SECURITY;

-- Platform admins can read all events
CREATE POLICY event_logs_platform_read ON analytics.event_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = auth.uid()
    )
  );

-- Tenant users can read their own tenant's events
CREATE POLICY event_logs_tenant_read ON analytics.event_logs
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Insert allowed for service role (triggers use SECURITY DEFINER)
CREATE POLICY event_logs_service_insert ON analytics.event_logs
  FOR INSERT
  WITH CHECK (true);

-- Dead letter queue: platform admins only
ALTER TABLE analytics.event_dead_letter ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_dead_letter_platform_read ON analytics.event_dead_letter
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = auth.uid()
    )
  );

-- Public notifications: platform admins only
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_notifications_read ON public.notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = auth.uid()
    )
    AND (recipient_id IS NULL OR recipient_id = auth.uid())
  );

CREATE POLICY public_notifications_update ON public.notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE auth_user_id = auth.uid()
    )
    AND (recipient_id IS NULL OR recipient_id = auth.uid())
  );

-- =============================================================================
-- 8. HELPER VIEWS
-- =============================================================================

-- Unprocessed event queue (used by processor polling)
CREATE OR REPLACE VIEW analytics.pending_events AS
  SELECT *
  FROM analytics.event_logs
  WHERE processed_at IS NULL
    AND retry_count < max_retries
  ORDER BY created_at ASC;

-- Event processing stats (monitoring dashboard)
CREATE OR REPLACE VIEW analytics.event_processing_stats AS
  SELECT
    event_type,
    COUNT(*) FILTER (WHERE processed_at IS NOT NULL) AS processed_count,
    COUNT(*) FILTER (WHERE processed_at IS NULL AND retry_count < max_retries) AS pending_count,
    COUNT(*) FILTER (WHERE retry_count >= max_retries AND processed_at IS NULL) AS failed_count,
    AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) FILTER (WHERE processed_at IS NOT NULL) AS avg_processing_seconds,
    MAX(created_at) AS last_event_at
  FROM analytics.event_logs
  GROUP BY event_type;
