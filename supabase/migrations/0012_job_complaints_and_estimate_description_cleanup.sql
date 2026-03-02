-- =============================================================================
-- 0012_job_complaints_and_estimate_description_cleanup.sql
-- Canonicalize job complaint storage and remove estimate description fields
-- =============================================================================

-- 1) Backfill job complaints from estimate.description where job has no complaint text
-- Guard for environments where `tenant.estimates.description` was already removed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'tenant'
      AND table_name = 'estimates'
      AND column_name = 'description'
  ) THEN
    EXECUTE $sql$
      UPDATE tenant.jobcards j
      SET details = jsonb_set(
        COALESCE(j.details, '{}'::jsonb),
        '{complaints}',
        to_jsonb(e.description),
        true
      )
      FROM tenant.estimates e
      WHERE e.jobcard_id = j.id
        AND e.description IS NOT NULL
        AND COALESCE(
          NULLIF(j.details->>'complaints', ''),
          NULLIF(j.details->>'notes', ''),
          NULLIF(j.details->>'description', '')
        ) IS NULL
    $sql$;
  END IF;
END
$$;

-- 2) Canonicalize job details keys to only use `complaints`
UPDATE tenant.jobcards
SET details = jsonb_set(
  (COALESCE(details, '{}'::jsonb) - 'notes' - 'description'),
  '{complaints}',
  to_jsonb(
    COALESCE(
      NULLIF(details->>'complaints', ''),
      NULLIF(details->>'notes', ''),
      NULLIF(details->>'description', '')
    )
  ),
  true
)
WHERE COALESCE(
  NULLIF(details->>'complaints', ''),
  NULLIF(details->>'notes', ''),
  NULLIF(details->>'description', '')
) IS NOT NULL;

-- Remove legacy keys for all rows
UPDATE tenant.jobcards
SET details = COALESCE(details, '{}'::jsonb) - 'notes' - 'description'
WHERE details ? 'notes' OR details ? 'description';

-- 3) Remove deprecated columns from estimates and estimate_items
ALTER TABLE tenant.estimates
  DROP COLUMN IF EXISTS description;

ALTER TABLE tenant.estimate_items
  DROP COLUMN IF EXISTS description;
