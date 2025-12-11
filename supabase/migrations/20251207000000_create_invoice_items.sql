-- Create invoice_items table to store line items for invoices
CREATE TABLE IF NOT EXISTS tenant.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  item_name text NOT NULL,
  item_number text,
  description text,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  labor_cost numeric(12,2) DEFAULT 0 NOT NULL CHECK (labor_cost >= 0),
  total numeric(12,2) GENERATED ALWAYS AS ((qty::numeric * unit_price) + labor_cost) STORED,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  CONSTRAINT invoice_items_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES tenant.invoices(id) ON DELETE RESTRICT
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON tenant.invoice_items (invoice_id) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE tenant.invoice_items FORCE ROW LEVEL SECURITY;

-- RLS Policies: tenant isolation via parent invoice
CREATE POLICY invoice_items_select_policy ON tenant.invoice_items
  FOR SELECT
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM tenant.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.tenant_id::text = (auth.jwt() ->> 'tenant_id')
        AND i.deleted_at IS NULL
    )
  );

CREATE POLICY invoice_items_insert_policy ON tenant.invoice_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.tenant_id::text = (auth.jwt() ->> 'tenant_id')
    )
  );

CREATE POLICY invoice_items_update_policy ON tenant.invoice_items
  FOR UPDATE
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM tenant.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.tenant_id::text = (auth.jwt() ->> 'tenant_id')
        AND i.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.tenant_id::text = (auth.jwt() ->> 'tenant_id')
    )
  );

-- Soft delete: only admins
CREATE POLICY invoice_items_delete_policy ON tenant.invoice_items
  FOR UPDATE
  USING (
    deleted_at IS NULL AND
    (auth.jwt() ->> 'role') IN ('admin', 'tenant') AND
    EXISTS (
      SELECT 1 FROM tenant.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.tenant_id::text = (auth.jwt() ->> 'tenant_id')
        AND i.deleted_at IS NULL
    )
  );

-- Add comments
COMMENT ON TABLE tenant.invoice_items IS 'Line items for invoices, copied from estimate items when invoice is generated';
COMMENT ON COLUMN tenant.invoice_items.item_name IS 'Name of the item/part';
COMMENT ON COLUMN tenant.invoice_items.item_number IS 'Part number or SKU';
COMMENT ON COLUMN tenant.invoice_items.labor_cost IS 'Labor cost for this item';
