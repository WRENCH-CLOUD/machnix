-- =============================================================================
-- 0013_priority_webhooks.sql
-- Webhook triggers for the priority-scoring edge function
-- =============================================================================
BEGIN;

-- 1. Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_priority_scoring()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text;
  webhook_secret text;
  payload jsonb;
  request_id bigint;
BEGIN
  -- We assume local dev for now or read from vault in prod.
  -- Hardcoding local URL for development / testing
  webhook_url := current_setting('custom.edge_function_url', true);
  webhook_secret := current_setting('custom.edge_function_secret', true);
  
  -- Fallback for local
  IF webhook_url IS NULL OR webhook_url = '' THEN
    webhook_url := 'http://kong:8000/functions/v1/priority-scoring';
  END IF;

  payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'type', TG_OP,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
  );

  SELECT net.http_post(
      url:='http://kong:8000/functions/v1/priority-scoring',
      headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(webhook_secret, 'ANON_KEY')
      ),
      body:=payload
  ) INTO request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger priority scoring webhook: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to job_card_tasks
DROP TRIGGER IF EXISTS trg_job_card_tasks_priority ON tenant.job_card_tasks;
CREATE TRIGGER trg_job_card_tasks_priority
  AFTER INSERT OR UPDATE ON tenant.job_card_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_priority_scoring();

-- 4. Attach trigger to jobcards (for urgency trickledown)
DROP TRIGGER IF EXISTS trg_jobcards_priority ON tenant.jobcards;
CREATE TRIGGER trg_jobcards_priority
  AFTER UPDATE OF is_waiting_on_site, hard_deadline, soft_deadline ON tenant.jobcards
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_priority_scoring();

COMMIT;
