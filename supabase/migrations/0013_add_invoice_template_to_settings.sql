ALTER TABLE tenant.settings
ADD COLUMN IF NOT EXISTS invoice_template text NOT NULL DEFAULT 'auto';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'settings_invoice_template_check'
  ) THEN
    ALTER TABLE tenant.settings
    ADD CONSTRAINT settings_invoice_template_check
    CHECK (invoice_template IN ('auto', 'standard', 'compact', 'detailed'));
  END IF;
END $$;