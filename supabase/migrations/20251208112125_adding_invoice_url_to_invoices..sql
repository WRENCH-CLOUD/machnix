-- Add columns to store PDF file information
ALTER TABLE tenant.invoices ADD COLUMN file_key TEXT;
ALTER TABLE tenant.invoices ADD COLUMN filename TEXT;