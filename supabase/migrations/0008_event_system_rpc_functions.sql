-- =============================================================================
-- 0008_event_system_rpc_functions.sql
-- RPC functions for safe event processing operations
-- =============================================================================

-- Atomic retry count increment with error recording
-- This prevents race conditions when multiple processors run concurrently
CREATE OR REPLACE FUNCTION public.increment_event_retry(
  p_event_id uuid,
  p_error_message text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE analytics.event_logs
  SET
    retry_count = retry_count + 1,
    error_message = p_error_message
  WHERE id = p_event_id
    AND processed_at IS NULL;
END;
$$;

-- Claim a batch of events for processing (advisory lock pattern)
-- Prevents multiple processor instances from working on the same events
CREATE OR REPLACE FUNCTION analytics.claim_pending_events(
  p_batch_size int DEFAULT 50
) RETURNS SETOF analytics.event_logs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH claimable AS (
    SELECT id
    FROM analytics.event_logs
    WHERE processed_at IS NULL
      AND retry_count < max_retries
    ORDER BY created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED  -- critical: skip rows locked by other processors
  )
  SELECT el.*
  FROM analytics.event_logs el
  INNER JOIN claimable c ON c.id = el.id;
END;
$$;

-- Get processing statistics for monitoring dashboard
CREATE OR REPLACE FUNCTION analytics.get_processing_stats()
RETURNS TABLE (
  event_type text,
  total_count bigint,
  processed_count bigint,
  pending_count bigint,
  failed_count bigint,
  dead_letter_count bigint,
  avg_processing_ms numeric,
  oldest_pending timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    el.event_type,
    COUNT(*)::bigint AS total_count,
    COUNT(*) FILTER (WHERE el.processed_at IS NOT NULL)::bigint AS processed_count,
    COUNT(*) FILTER (WHERE el.processed_at IS NULL AND el.retry_count < el.max_retries)::bigint AS pending_count,
    COUNT(*) FILTER (WHERE el.retry_count >= el.max_retries AND el.processed_at IS NULL)::bigint AS failed_count,
    COALESCE((
      SELECT COUNT(*)::bigint
      FROM analytics.event_dead_letter dl
      WHERE dl.event_type = el.event_type AND dl.resolved_at IS NULL
    ), 0) AS dead_letter_count,
    ROUND(AVG(
      EXTRACT(EPOCH FROM (el.processed_at - el.created_at)) * 1000
    ) FILTER (WHERE el.processed_at IS NOT NULL), 2) AS avg_processing_ms,
    MIN(el.created_at) FILTER (WHERE el.processed_at IS NULL AND el.retry_count < el.max_retries) AS oldest_pending
  FROM analytics.event_logs el
  GROUP BY el.event_type;
END;
$$;
