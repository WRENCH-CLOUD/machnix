-- Create invoice_items table to store line items for invoices
CREATE TABLE IF NOT EXISTS "tenant"."invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "item_number" "text",
    "description" "text",
    "qty" integer NOT NULL DEFAULT 1,
    "unit_price" numeric(12,2) NOT NULL DEFAULT 0,
    "labor_cost" numeric(12,2) DEFAULT 0,
    "total" numeric(12,2) GENERATED ALWAYS AS (((("qty")::numeric * "unit_price") + COALESCE("labor_cost", 0))) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "tenant"."invoice_items" OWNER TO "postgres";

-- Add primary key
ALTER TABLE ONLY "tenant"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");

-- Add foreign key to invoices
ALTER TABLE ONLY "tenant"."invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_fkey" 
    FOREIGN KEY ("invoice_id") 
    REFERENCES "tenant"."invoices"("id") 
    ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX "idx_invoice_items_invoice_id" ON "tenant"."invoice_items" USING "btree" ("invoice_id");

-- Add RLS policies
ALTER TABLE "tenant"."invoice_items" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select invoice items for their tenant's invoices
CREATE POLICY "tenant_isolation_select" ON "tenant"."invoice_items"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "tenant"."invoices"
            WHERE "invoices"."id" = "invoice_items"."invoice_id"
            AND "invoices"."tenant_id" = "tenant"."current_tenant"()
        )
    );

-- Policy: Users can insert invoice items for their tenant's invoices
CREATE POLICY "tenant_isolation_insert" ON "tenant"."invoice_items"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "tenant"."invoices"
            WHERE "invoices"."id" = "invoice_items"."invoice_id"
            AND "invoices"."tenant_id" = "tenant"."current_tenant"()
        )
    );

-- Policy: Users can update invoice items for their tenant's invoices
CREATE POLICY "tenant_isolation_update" ON "tenant"."invoice_items"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "tenant"."invoices"
            WHERE "invoices"."id" = "invoice_items"."invoice_id"
            AND "invoices"."tenant_id" = "tenant"."current_tenant"()
        )
    );

-- Policy: Users can delete invoice items for their tenant's invoices
CREATE POLICY "tenant_isolation_delete" ON "tenant"."invoice_items"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "tenant"."invoices"
            WHERE "invoices"."id" = "invoice_items"."invoice_id"
            AND "invoices"."tenant_id" = "tenant"."current_tenant"()
        )
    );

-- Add comments
COMMENT ON TABLE "tenant"."invoice_items" IS 'Line items for invoices, copied from estimate items when invoice is generated';
COMMENT ON COLUMN "tenant"."invoice_items"."item_name" IS 'Name of the item/part';
COMMENT ON COLUMN "tenant"."invoice_items"."item_number" IS 'Part number or SKU';
COMMENT ON COLUMN "tenant"."invoice_items"."labor_cost" IS 'Labor cost for this item';
