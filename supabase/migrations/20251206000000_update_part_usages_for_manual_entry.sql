-- -- Make part_id nullable to support manual part entry without inventory reference
-- ALTER TABLE "tenant"."part_usages" 
-- ALTER COLUMN "part_id" DROP NOT NULL;

-- -- Add fields to store manual part entry details
-- ALTER TABLE "tenant"."part_usages" 
-- ADD COLUMN IF NOT EXISTS "part_name" text,
-- ADD COLUMN IF NOT EXISTS "part_number" text,
-- ADD COLUMN IF NOT EXISTS "labor_cost" numeric(12,2) DEFAULT 0;

-- -- Add comment explaining the schema
-- COMMENT ON COLUMN "tenant"."part_usages"."part_id" IS 
-- 'Reference to parts inventory. NULL for manual entries without inventory tracking.';

-- COMMENT ON COLUMN "tenant"."part_usages"."part_name" IS 
-- 'Part name for manual entries. Used when part_id is NULL.';

-- COMMENT ON COLUMN "tenant"."part_usages"."part_number" IS 
-- 'Part number for manual entries. Used when part_id is NULL.';

-- COMMENT ON COLUMN "tenant"."part_usages"."labor_cost" IS 
-- 'Labor cost associated with installing/using this part.';
