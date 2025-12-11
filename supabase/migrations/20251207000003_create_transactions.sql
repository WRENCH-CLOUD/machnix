-- CREATE TABLE IF NOT EXISTS tenant.payment_transactions (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   tenant_id uuid NOT NULL,
--   invoice_id uuid NOT NULL,
--   mode tenant.payment_mode NOT NULL,
--   amount numeric(12,2) NOT NULL CHECK (amount > 0),
--   razorpay_order_id text,
--   razorpay_payment_id text,
--   razorpay_signature text,
--   status tenant.payment_status DEFAULT 'initiated' NOT NULL,
--   created_at timestamptz DEFAULT now() NOT NULL,
--   paid_at timestamptz,
--   deleted_at timestamptz,
--   deleted_by uuid,
--   CONSTRAINT payment_transactions_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenant.tenants(id) ON DELETE RESTRICT,
--   CONSTRAINT payment_transactions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES tenant.invoices(id) ON DELETE RESTRICT
-- );

-- ALTER TABLE tenant.payment_transactions FORCE ROW LEVEL SECURITY;



-- -- Payment transactions indexes
-- CREATE INDEX IF NOT EXISTS idx_payment_tx_tenant_id ON tenant.payment_transactions (tenant_id) WHERE deleted_at IS NULL;
-- CREATE INDEX IF NOT EXISTS idx_payment_tx_invoice ON tenant.payment_transactions (invoice_id) WHERE deleted_at IS NULL;
-- CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON tenant.payment_transactions (tenant_id, status, created_at DESC) WHERE deleted_at IS NULL;
-- CREATE INDEX IF NOT EXISTS idx_payment_tx_razorpay_order ON tenant.payment_transactions (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
