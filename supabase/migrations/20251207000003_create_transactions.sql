-- Create transactions table for payment processing
CREATE TABLE IF NOT EXISTS "tenant"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "jobcard_id" "uuid",
    "transaction_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "payment_method" "text" NOT NULL,
    "reference_id" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transactions_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'card'::"text", 'upi'::"text", 'bank_transfer'::"text", 'cheque'::"text"])))
);

ALTER TABLE "tenant"."transactions" OWNER TO "postgres";

-- Add primary key
ALTER TABLE ONLY "tenant"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");

-- Add foreign keys
ALTER TABLE ONLY "tenant"."transactions"
    ADD CONSTRAINT "transactions_invoice_id_fkey" 
    FOREIGN KEY ("invoice_id") 
    REFERENCES "tenant"."invoices"("id") 
    ON DELETE CASCADE;

ALTER TABLE ONLY "tenant"."transactions"
    ADD CONSTRAINT "transactions_jobcard_id_fkey" 
    FOREIGN KEY ("jobcard_id") 
    REFERENCES "tenant"."jobcards"("id") 
    ON DELETE SET NULL;

ALTER TABLE ONLY "tenant"."transactions"
    ADD CONSTRAINT "transactions_tenant_id_fkey" 
    FOREIGN KEY ("tenant_id") 
    REFERENCES "tenant"."tenants"("id") 
    ON DELETE CASCADE;

-- Add indexes
CREATE INDEX "idx_transactions_invoice_id" ON "tenant"."transactions" USING "btree" ("invoice_id");
CREATE INDEX "idx_transactions_jobcard_id" ON "tenant"."transactions" USING "btree" ("jobcard_id");
CREATE INDEX "idx_transactions_tenant_id" ON "tenant"."transactions" USING "btree" ("tenant_id");
CREATE INDEX "idx_transactions_date" ON "tenant"."transactions" USING "btree" ("transaction_date");

-- Disable RLS for development
ALTER TABLE "tenant"."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant"."transactions" DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT ALL ON "tenant"."transactions" TO anon, authenticated;

-- Add trigger for updated_at
CREATE TRIGGER "set_updated_at"
    BEFORE UPDATE ON "tenant"."transactions"
    FOR EACH ROW
    EXECUTE FUNCTION "tenant"."update_updated_at_column"();

-- Add comments
COMMENT ON TABLE "tenant"."transactions" IS 'Payment transactions for invoices';
COMMENT ON COLUMN "tenant"."transactions"."transaction_date" IS 'Date and time when payment was made';
COMMENT ON COLUMN "tenant"."transactions"."amount" IS 'Amount paid in this transaction';
COMMENT ON COLUMN "tenant"."transactions"."payment_method" IS 'Method of payment: cash, card, upi, bank_transfer, cheque';
COMMENT ON COLUMN "tenant"."transactions"."reference_id" IS 'External reference ID (transaction ID, cheque number, etc.)';
