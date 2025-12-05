


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "tenant";


ALTER SCHEMA "tenant" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "vehicle_data";


ALTER SCHEMA "vehicle_data" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "tenant"."Roles" AS ENUM (
    'admin',
    'tenant',
    'mechanic'
);


ALTER TYPE "tenant"."Roles" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_mechanic_active_jobs"("mechanic_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE tenant.mechanics
    SET active_jobs = GREATEST(active_jobs - 1, 0),
        updated_at = NOW()
    WHERE id = mechanic_id;
END;
$$;


ALTER FUNCTION "public"."decrement_mechanic_active_jobs"("mechanic_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_user_tenant"("user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  existing_tenant_id uuid;
  new_tenant_id uuid;
  user_email text;
BEGIN
  -- Check if user already has a tenant
  SELECT tenant_id INTO existing_tenant_id
  FROM tenant.users
  WHERE id = user_id
  LIMIT 1;
  
  IF existing_tenant_id IS NOT NULL THEN
    RETURN existing_tenant_id;
  END IF;
  
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  -- Create a new tenant for the user
  INSERT INTO tenant.tenants (name, subscription_status)
  VALUES (
    'My Garage - ' || COALESCE(user_email, 'New User'),
    'trial'
  )
  RETURNING id INTO new_tenant_id;
  
  -- Update user with tenant_id
  UPDATE tenant.users
  SET tenant_id = new_tenant_id,
      role = 'admin' -- First user of a tenant becomes admin
  WHERE id = user_id;
  
  RETURN new_tenant_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_user_tenant"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'tenant'
    AS $$
DECLARE
  new_tenant_id uuid;
  user_role text;
BEGIN
  RAISE NOTICE 'Trigger handle_new_user started for user: %', new.email;
  
  -- Determine role based on email
  user_role := CASE 
    WHEN new.email IN ('khanarohithif@gmail.com', 'sagunverma24@gmail.com') THEN 'admin'
    ELSE 'frontdesk'
  END;
  
  RAISE NOTICE 'User role determined: %', user_role;
  
  -- Create a new tenant for the user
  BEGIN
    INSERT INTO tenant.tenants (name, subscription_status)
    VALUES (
      'Garage - ' || COALESCE(new.raw_user_meta_data->>'name', new.email),
      'trial'
    )
    RETURNING id INTO new_tenant_id;
    
    RAISE NOTICE 'Tenant created with ID: %', new_tenant_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating tenant: %', SQLERRM;
    RAISE;
  END;
  
  -- Insert into tenant.users table
  BEGIN
    INSERT INTO tenant.users (id, tenant_id, email, name, role)
    VALUES (
      new.id,
      new_tenant_id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'name', new.email),
      user_role
    );
    
    RAISE NOTICE 'User record created in tenant.users';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating user record: %', SQLERRM;
    RAISE;
  END;
  
  RAISE NOTICE 'Trigger handle_new_user completed successfully';
  RETURN new;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Unexpected error in handle_new_user: %', SQLERRM;
  RAISE;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_mechanic_active_jobs"("mechanic_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE tenant.mechanics
    SET active_jobs = active_jobs + 1,
        total_jobs = total_jobs + 1,
        updated_at = NOW()
    WHERE id = mechanic_id;
END;
$$;


ALTER FUNCTION "public"."increment_mechanic_active_jobs"("mechanic_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_config"("parameter" "text", "value" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    PERFORM set_config(parameter, value, false);
END;
$$;


ALTER FUNCTION "public"."set_config"("parameter" "text", "value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_tenant_insert"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  test_tenant_id uuid;
  test_user_id uuid := gen_random_uuid();
  result jsonb;
BEGIN
  -- Try to insert a tenant
  BEGIN
    INSERT INTO tenant.tenants (name, subscription_status)
    VALUES ('Test Garage', 'trial')
    RETURNING id INTO test_tenant_id;
    
    result := jsonb_build_object('tenant_created', true, 'tenant_id', test_tenant_id);
  EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object('tenant_created', false, 'tenant_error', SQLERRM);
    RETURN result;
  END;
  
  -- Try to insert a user
  BEGIN
    INSERT INTO tenant.users (id, tenant_id, email, name, role)
    VALUES (test_user_id, test_tenant_id, 'test@example.com', 'Test User', 'frontdesk');
    
    result := result || jsonb_build_object('user_created', true);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('user_created', false, 'user_error', SQLERRM);
    RETURN result;
  END;
  
  -- Clean up the test data
  DELETE FROM tenant.users WHERE id = test_user_id;
  DELETE FROM tenant.tenants WHERE id = test_tenant_id;
  
  result := result || jsonb_build_object('cleanup', 'success');
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."test_tenant_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tenant"."calculate_invoice_totals"("invoice_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    job_rec RECORD;
    tax_rate_val DECIMAL(5,2);
BEGIN
    -- Get jobcard totals
    SELECT labor_total, parts_total, discount_amount, tenant_id
    INTO job_rec
    FROM tenant.jobcards
    WHERE id = (SELECT jobcard_id FROM tenant.invoices WHERE id = invoice_id_param);
    
    -- Get tax rate
    SELECT tax_rate INTO tax_rate_val
    FROM tenant.settings
    WHERE tenant_id = job_rec.tenant_id;
    
    -- Update invoice
    UPDATE tenant.invoices
    SET subtotal = job_rec.labor_total + job_rec.parts_total,
        tax_amount = (job_rec.labor_total + job_rec.parts_total - job_rec.discount_amount) * (tax_rate_val / 100),
        discount_amount = job_rec.discount_amount,
        total_amount = (job_rec.labor_total + job_rec.parts_total - job_rec.discount_amount) * (1 + tax_rate_val / 100),
        updated_at = NOW()
    WHERE id = invoice_id_param;
END;
$$;


ALTER FUNCTION "tenant"."calculate_invoice_totals"("invoice_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tenant"."current_tenant"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;


ALTER FUNCTION "tenant"."current_tenant"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tenant"."current_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
    SELECT NULLIF(current_setting('app.tenant_id', true), '')::UUID;
$$;


ALTER FUNCTION "tenant"."current_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tenant"."generate_estimate_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    prefix TEXT;
    next_num INTEGER;
    new_estimate_number TEXT;
BEGIN
    -- Get prefix from settings
    SELECT estimate_prefix INTO prefix
    FROM tenant.settings
    WHERE tenant_id = NEW.tenant_id;
    
    -- Default prefix if not set
    IF prefix IS NULL THEN
        prefix := 'EST-';
    END IF;
    
    -- Get next number
    SELECT COALESCE(MAX(
        CASE 
            WHEN estimate_number ~ '^\D*(\d+)$' 
            THEN SUBSTRING(estimate_number FROM '\d+$')::INTEGER 
            ELSE 0 
        END
    ), 0) + 1 INTO next_num
    FROM tenant.estimates
    WHERE tenant_id = NEW.tenant_id;
    
    -- Generate new estimate number
    new_estimate_number := prefix || LPAD(next_num::TEXT, 6, '0');
    
    NEW.estimate_number := new_estimate_number;
    RETURN NEW;
END;
$_$;


ALTER FUNCTION "tenant"."generate_estimate_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tenant"."generate_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    prefix TEXT;
    next_num INTEGER;
    new_invoice_number TEXT;
BEGIN
    -- Get prefix from settings
    SELECT invoice_prefix INTO prefix
    FROM tenant.settings
    WHERE tenant_id = NEW.tenant_id;
    
    -- Default prefix if not set
    IF prefix IS NULL THEN
        prefix := 'INV-';
    END IF;
    
    -- Get next number
    SELECT COALESCE(MAX(
        CASE 
            WHEN invoice_number ~ '^\D*(\d+)$' 
            THEN SUBSTRING(invoice_number FROM '\d+$')::INTEGER 
            ELSE 0 
        END
    ), 0) + 1 INTO next_num
    FROM tenant.invoices
    WHERE tenant_id = NEW.tenant_id;
    
    -- Generate new invoice number
    new_invoice_number := prefix || LPAD(next_num::TEXT, 6, '0');
    
    NEW.invoice_number := new_invoice_number;
    RETURN NEW;
END;
$_$;


ALTER FUNCTION "tenant"."generate_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tenant"."generate_job_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    prefix TEXT;
    next_num INTEGER;
    new_job_number TEXT;
BEGIN
    -- Get prefix from settings
    SELECT job_prefix INTO prefix
    FROM tenant.settings
    WHERE tenant_id = NEW.tenant_id;
    
    -- Default prefix if not set
    IF prefix IS NULL THEN
        prefix := 'JOB-';
    END IF;
    
    -- Get next number
    SELECT COALESCE(MAX(
        CASE 
            WHEN job_number ~ '^\D*(\d+)$' 
            THEN SUBSTRING(job_number FROM '\d+$')::INTEGER 
            ELSE 0 
        END
    ), 0) + 1 INTO next_num
    FROM tenant.jobcards
    WHERE tenant_id = NEW.tenant_id;
    
    -- Generate new job number
    new_job_number := prefix || LPAD(next_num::TEXT, 6, '0');
    
    NEW.job_number := new_job_number;
    RETURN NEW;
END;
$_$;


ALTER FUNCTION "tenant"."generate_job_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tenant"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_ARGV[0] = 'updated_at' THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "tenant"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tenant"."update_part_stock"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tenant.parts
        SET stock_on_hand = stock_on_hand + 
            CASE 
                WHEN NEW.transaction_type IN ('purchase', 'return') THEN NEW.quantity
                WHEN NEW.transaction_type IN ('sale', 'adjustment') THEN -NEW.quantity
                ELSE 0
            END
        WHERE id = NEW.part_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "tenant"."update_part_stock"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tenant"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "tenant"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."schema_migrations" (
    "version" "text" NOT NULL,
    "applied_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."schema_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_category" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."vehicle_category" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_make" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_make" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_model" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "make_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "model_code" "text",
    "vehicle_category" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_model" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "jobcard_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "activity_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "entity_type" "text",
    "entity_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "tenant"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."customer_communications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "jobcard_id" "uuid",
    "type" "text" NOT NULL,
    "direction" "text" NOT NULL,
    "subject" "text",
    "message" "text",
    "status" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "sent_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."customer_communications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "address" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."dvi_checkpoint_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."dvi_checkpoint_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."dvi_checkpoints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "display_order" integer DEFAULT 0,
    "is_required" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."dvi_checkpoints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."dvi_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "jobcard_id" "uuid" NOT NULL,
    "checkpoint_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "checkpoint_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."dvi_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."dvi_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dvi_item_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "url" "text" NOT NULL,
    "caption" "text",
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."dvi_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."dvi_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."dvi_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."estimate_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "estimate_id" "uuid" NOT NULL,
    "part_id" "uuid",
    "custom_name" "text",
    "custom_part_number" "text",
    "description" "text",
    "qty" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "labor_cost" numeric(10,2) DEFAULT 0,
    "total" numeric(10,2) GENERATED ALWAYS AS (((("qty")::numeric * "unit_price") + "labor_cost")) STORED,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."estimate_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."estimates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "jobcard_id" "uuid",
    "created_by" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "total_amount" numeric(12,2) DEFAULT 0,
    "tax_amount" numeric(12,2) DEFAULT 0,
    "currency" "text" DEFAULT 'INR'::"text",
    "items" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "estimate_number" "text" DEFAULT ''::"text" NOT NULL,
    "customer_id" "uuid",
    "vehicle_id" "uuid",
    "description" "text",
    "labor_total" numeric(10,2) DEFAULT 0,
    "parts_total" numeric(10,2) DEFAULT 0,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "valid_until" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "rejection_reason" "text"
);


ALTER TABLE "tenant"."estimates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."inventory_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "part_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_cost" numeric(10,2),
    "reference_type" "text",
    "reference_id" "uuid",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."inventory_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "jobcard_id" "uuid",
    "estimate_id" "uuid",
    "invoice_number" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "subtotal" numeric(12,2) DEFAULT 0,
    "tax" numeric(12,2) DEFAULT 0,
    "total" numeric(12,2) DEFAULT 0,
    "due_date" "date",
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "payment_mode" "text",
    "customer_id" "uuid",
    "invoice_date" timestamp with time zone DEFAULT "now"(),
    "tax_amount" numeric(10,2) DEFAULT 0,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "total_amount" numeric(10,2) DEFAULT 0,
    "paid_amount" numeric(10,2) DEFAULT 0,
    "notes" "text",
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "balance" numeric(10,2) GENERATED ALWAYS AS (("total_amount" - "paid_amount")) STORED,
    CONSTRAINT "invoices_payment_mode_check" CHECK ((("payment_mode" = ANY (ARRAY['cash'::"text", 'razorpay'::"text"])) OR ("payment_mode" IS NULL)))
);


ALTER TABLE "tenant"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."jobcards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "job_number" "text" NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "assigned_mechanic_id" "uuid",
    "status" "text" DEFAULT 'created'::"text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."jobcards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."mechanics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "skills" "text"[],
    "hourly_rate" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."mechanics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "jobcard_id" "uuid",
    "channel" "text" NOT NULL,
    "template" "text",
    "payload" "jsonb",
    "status" "text" DEFAULT 'queued'::"text",
    "sent_at" timestamp with time zone,
    "user_id" "uuid",
    "category" "text",
    "entity_type" "text",
    "entity_id" "uuid",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."part_usages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "jobcard_id" "uuid" NOT NULL,
    "part_id" "uuid" NOT NULL,
    "qty" integer NOT NULL,
    "unit_price" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."part_usages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "sku" "text",
    "name" "text" NOT NULL,
    "description" "text",
    "unit_cost" numeric(12,2) DEFAULT 0,
    "sell_price" numeric(12,2) DEFAULT 0,
    "stock_on_hand" integer DEFAULT 0,
    "reorder_level" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."parts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "mode" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "razorpay_order_id" "text",
    "razorpay_payment_id" "text",
    "razorpay_signature" "text",
    "status" "text" DEFAULT 'initiated'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "paid_at" timestamp with time zone,
    CONSTRAINT "payment_transactions_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "payment_transactions_mode_check" CHECK (("mode" = ANY (ARRAY['cash'::"text", 'razorpay'::"text"]))),
    CONSTRAINT "payment_transactions_status_check" CHECK (("status" = ANY (ARRAY['initiated'::"text", 'success'::"text", 'failed'::"text"])))
);


ALTER TABLE "tenant"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "method" "text",
    "gateway_ref" "text",
    "status" "text" DEFAULT 'initiated'::"text" NOT NULL,
    "paid_at" timestamp with time zone,
    "payment_date" timestamp with time zone DEFAULT "now"(),
    "payment_method" "text" DEFAULT 'cash'::"text" NOT NULL,
    "reference_number" "text",
    "notes" "text",
    "received_by" "uuid"
);


ALTER TABLE "tenant"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."razorpay_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "key_id" "text" NOT NULL,
    "key_secret" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."razorpay_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "tax_rate" numeric(5,2) DEFAULT 0,
    "currency" "text" DEFAULT 'INR'::"text",
    "timezone" "text" DEFAULT 'Asia/Kolkata'::"text",
    "sms_enabled" boolean DEFAULT false,
    "email_enabled" boolean DEFAULT false,
    "whatsapp_enabled" boolean DEFAULT false,
    "invoice_prefix" "text" DEFAULT 'INV-'::"text",
    "job_prefix" "text" DEFAULT 'JOB-'::"text",
    "estimate_prefix" "text" DEFAULT 'EST-'::"text",
    "invoice_footer" "text",
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);

ALTER TABLE ONLY "tenant"."tenants" FORCE ROW LEVEL SECURITY;


ALTER TABLE "tenant"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "role" "text" DEFAULT 'frontdesk'::"text",
    "avatar_url" "text",
    "is_active" boolean DEFAULT true,
    "last_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "tenant"."users" FORCE ROW LEVEL SECURITY;


ALTER TABLE "tenant"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "tenant"."vehicles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "reg_no" "text" NOT NULL,
    "vin" "text",
    "make_id" "uuid",
    "model_id" "uuid",
    "year" smallint,
    "odometer" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "tenant"."vehicles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "tenant"."v_vehicle_full" AS
 SELECT "v"."id" AS "vehicle_id",
    "v"."tenant_id",
    "v"."customer_id",
    "v"."reg_no",
    "v"."vin",
    "v"."year",
    "v"."odometer",
    "vm"."id" AS "model_id",
    "vm"."name" AS "model_name",
    "vm"."vehicle_category",
    "vm"."make_id",
    "m"."name" AS "make_name"
   FROM (("tenant"."vehicles" "v"
     LEFT JOIN "public"."vehicle_model" "vm" ON (("vm"."id" = "v"."model_id")))
     LEFT JOIN "public"."vehicle_make" "m" ON (("m"."id" = "v"."make_id")));


ALTER VIEW "tenant"."v_vehicle_full" OWNER TO "postgres";


ALTER TABLE ONLY "public"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "public"."vehicle_category"
    ADD CONSTRAINT "vehicle_category_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."vehicle_category"
    ADD CONSTRAINT "vehicle_category_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_make"
    ADD CONSTRAINT "vehicle_make_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."vehicle_make"
    ADD CONSTRAINT "vehicle_make_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_model"
    ADD CONSTRAINT "vehicle_model_make_id_name_key" UNIQUE ("make_id", "name");



ALTER TABLE ONLY "public"."vehicle_model"
    ADD CONSTRAINT "vehicle_model_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."customer_communications"
    ADD CONSTRAINT "customer_communications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."dvi_checkpoint_categories"
    ADD CONSTRAINT "dvi_checkpoint_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."dvi_checkpoints"
    ADD CONSTRAINT "dvi_checkpoints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."dvi_items"
    ADD CONSTRAINT "dvi_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."dvi_photos"
    ADD CONSTRAINT "dvi_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."dvi_templates"
    ADD CONSTRAINT "dvi_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."estimate_items"
    ADD CONSTRAINT "estimate_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."estimates"
    ADD CONSTRAINT "estimates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."jobcards"
    ADD CONSTRAINT "jobcards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."mechanics"
    ADD CONSTRAINT "mechanics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."part_usages"
    ADD CONSTRAINT "part_usages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."parts"
    ADD CONSTRAINT "parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."razorpay_settings"
    ADD CONSTRAINT "razorpay_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."razorpay_settings"
    ADD CONSTRAINT "razorpay_settings_tenant_id_key" UNIQUE ("tenant_id");



ALTER TABLE ONLY "tenant"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."settings"
    ADD CONSTRAINT "settings_tenant_id_key" UNIQUE ("tenant_id");



ALTER TABLE ONLY "tenant"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "tenant"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "tenant"."vehicles"
    ADD CONSTRAINT "vehicles_tenant_id_reg_no_key" UNIQUE ("tenant_id", "reg_no");



CREATE INDEX "idx_vehicle_make_name" ON "public"."vehicle_make" USING "btree" ("lower"("name"));



CREATE INDEX "idx_vehicle_model_name" ON "public"."vehicle_model" USING "btree" ("lower"("name"));



CREATE INDEX "idx_activities_created_at" ON "tenant"."activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activities_entity" ON "tenant"."activities" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_activities_jobcard_id" ON "tenant"."activities" USING "btree" ("jobcard_id");



CREATE INDEX "idx_activities_user_id" ON "tenant"."activities" USING "btree" ("user_id");



CREATE INDEX "idx_customer_communications_customer_id" ON "tenant"."customer_communications" USING "btree" ("customer_id");



CREATE INDEX "idx_customer_communications_jobcard_id" ON "tenant"."customer_communications" USING "btree" ("jobcard_id");



CREATE INDEX "idx_customers_email" ON "tenant"."customers" USING "btree" ("email");



CREATE INDEX "idx_customers_phone" ON "tenant"."customers" USING "btree" ("phone");



CREATE INDEX "idx_customers_tenant_id" ON "tenant"."customers" USING "btree" ("tenant_id");



CREATE INDEX "idx_customers_tenant_name" ON "tenant"."customers" USING "btree" ("tenant_id", "lower"("name"));



CREATE INDEX "idx_customers_tenant_phone" ON "tenant"."customers" USING "btree" ("tenant_id", "phone");



CREATE INDEX "idx_estimates_customer_id" ON "tenant"."estimates" USING "btree" ("customer_id");



CREATE INDEX "idx_estimates_estimate_number" ON "tenant"."estimates" USING "btree" ("estimate_number");



CREATE INDEX "idx_estimates_status" ON "tenant"."estimates" USING "btree" ("status");



CREATE INDEX "idx_estimates_tenant_status" ON "tenant"."estimates" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_inventory_transactions_part_id" ON "tenant"."inventory_transactions" USING "btree" ("part_id");



CREATE INDEX "idx_inventory_transactions_reference" ON "tenant"."inventory_transactions" USING "btree" ("reference_type", "reference_id");



CREATE INDEX "idx_invoices_invoice_number" ON "tenant"."invoices" USING "btree" ("invoice_number");



CREATE INDEX "idx_invoices_jobcard" ON "tenant"."invoices" USING "btree" ("tenant_id", "jobcard_id");



CREATE INDEX "idx_invoices_jobcard_id" ON "tenant"."invoices" USING "btree" ("jobcard_id");



CREATE INDEX "idx_invoices_status" ON "tenant"."invoices" USING "btree" ("status");



CREATE INDEX "idx_invoices_tenant_status" ON "tenant"."invoices" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_jobcards_created_at" ON "tenant"."jobcards" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_jobcards_customer_id" ON "tenant"."jobcards" USING "btree" ("customer_id");



CREATE INDEX "idx_jobcards_job_number" ON "tenant"."jobcards" USING "btree" ("job_number");



CREATE INDEX "idx_jobcards_mechanic_id" ON "tenant"."jobcards" USING "btree" ("assigned_mechanic_id");



CREATE INDEX "idx_jobcards_status" ON "tenant"."jobcards" USING "btree" ("status");



CREATE INDEX "idx_jobcards_tenant_id" ON "tenant"."jobcards" USING "btree" ("tenant_id");



CREATE INDEX "idx_jobcards_tenant_status" ON "tenant"."jobcards" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_jobcards_vehicle" ON "tenant"."jobcards" USING "btree" ("tenant_id", "vehicle_id");



CREATE INDEX "idx_jobcards_vehicle_id" ON "tenant"."jobcards" USING "btree" ("vehicle_id");



CREATE INDEX "idx_mechanics_tenant" ON "tenant"."mechanics" USING "btree" ("tenant_id");



CREATE INDEX "idx_mechanics_tenant_id" ON "tenant"."mechanics" USING "btree" ("tenant_id");



CREATE INDEX "idx_notifications_created_at" ON "tenant"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_is_read" ON "tenant"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_tenant" ON "tenant"."notifications" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_notifications_user_id" ON "tenant"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_part_usages_jobcard" ON "tenant"."part_usages" USING "btree" ("tenant_id", "jobcard_id");



CREATE INDEX "idx_part_usages_jobcard_id" ON "tenant"."part_usages" USING "btree" ("jobcard_id");



CREATE INDEX "idx_part_usages_part_id" ON "tenant"."part_usages" USING "btree" ("part_id");



CREATE INDEX "idx_parts_sku" ON "tenant"."parts" USING "btree" ("sku");



CREATE INDEX "idx_parts_tenant_id" ON "tenant"."parts" USING "btree" ("tenant_id");



CREATE INDEX "idx_parts_tenant_name" ON "tenant"."parts" USING "btree" ("tenant_id", "lower"("name"));



CREATE INDEX "idx_parts_tenant_sku" ON "tenant"."parts" USING "btree" ("tenant_id", "sku");



CREATE INDEX "idx_payment_tx_invoice" ON "tenant"."payment_transactions" USING "btree" ("tenant_id", "invoice_id");



CREATE INDEX "idx_payments_invoice" ON "tenant"."payments" USING "btree" ("tenant_id", "invoice_id");



CREATE INDEX "idx_users_auth_user_id" ON "tenant"."users" USING "btree" ("auth_user_id");



CREATE INDEX "idx_users_email" ON "tenant"."users" USING "btree" ("email");



CREATE INDEX "idx_users_tenant_id" ON "tenant"."users" USING "btree" ("tenant_id");



CREATE INDEX "idx_vehicles_customer_id" ON "tenant"."vehicles" USING "btree" ("customer_id");



CREATE INDEX "idx_vehicles_reg_no" ON "tenant"."vehicles" USING "btree" ("reg_no");



CREATE INDEX "idx_vehicles_tenant_customer" ON "tenant"."vehicles" USING "btree" ("tenant_id", "customer_id");



CREATE INDEX "idx_vehicles_tenant_id" ON "tenant"."vehicles" USING "btree" ("tenant_id");



CREATE INDEX "idx_vehicles_tenant_reg" ON "tenant"."vehicles" USING "btree" ("tenant_id", "lower"("reg_no"));



CREATE OR REPLACE TRIGGER "generate_estimate_number_trigger" BEFORE INSERT ON "tenant"."estimates" FOR EACH ROW WHEN ((("new"."estimate_number" IS NULL) OR ("new"."estimate_number" = ''::"text"))) EXECUTE FUNCTION "tenant"."generate_estimate_number"();



CREATE OR REPLACE TRIGGER "generate_invoice_number_trigger" BEFORE INSERT ON "tenant"."invoices" FOR EACH ROW WHEN ((("new"."invoice_number" IS NULL) OR ("new"."invoice_number" = ''::"text"))) EXECUTE FUNCTION "tenant"."generate_invoice_number"();



CREATE OR REPLACE TRIGGER "generate_jobcard_number" BEFORE INSERT ON "tenant"."jobcards" FOR EACH ROW WHEN ((("new"."job_number" IS NULL) OR ("new"."job_number" = ''::"text"))) EXECUTE FUNCTION "tenant"."generate_job_number"();



CREATE OR REPLACE TRIGGER "trg_customers_touch" BEFORE UPDATE ON "tenant"."customers" FOR EACH ROW EXECUTE FUNCTION "tenant"."touch_updated_at"('updated_at');



CREATE OR REPLACE TRIGGER "trg_estimates_touch" BEFORE UPDATE ON "tenant"."estimates" FOR EACH ROW EXECUTE FUNCTION "tenant"."touch_updated_at"('updated_at');



CREATE OR REPLACE TRIGGER "trg_parts_touch" BEFORE UPDATE ON "tenant"."parts" FOR EACH ROW EXECUTE FUNCTION "tenant"."touch_updated_at"('updated_at');



CREATE OR REPLACE TRIGGER "update_customers_updated_at" BEFORE UPDATE ON "tenant"."customers" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_dvi_checkpoint_categories_updated_at" BEFORE UPDATE ON "tenant"."dvi_checkpoint_categories" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_dvi_checkpoints_updated_at" BEFORE UPDATE ON "tenant"."dvi_checkpoints" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_dvi_items_updated_at" BEFORE UPDATE ON "tenant"."dvi_items" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_dvi_templates_updated_at" BEFORE UPDATE ON "tenant"."dvi_templates" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_estimates_updated_at" BEFORE UPDATE ON "tenant"."estimates" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_inventory_stock" AFTER INSERT ON "tenant"."inventory_transactions" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_part_stock"();



CREATE OR REPLACE TRIGGER "update_invoices_updated_at" BEFORE UPDATE ON "tenant"."invoices" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_jobcards_updated_at" BEFORE UPDATE ON "tenant"."jobcards" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_parts_updated_at" BEFORE UPDATE ON "tenant"."parts" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_razorpay_settings_updated_at" BEFORE UPDATE ON "tenant"."razorpay_settings" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_settings_updated_at" BEFORE UPDATE ON "tenant"."settings" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "tenant"."users" FOR EACH ROW EXECUTE FUNCTION "tenant"."update_updated_at_column"();



ALTER TABLE ONLY "public"."vehicle_model"
    ADD CONSTRAINT "vehicle_model_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "public"."vehicle_make"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "tenant"."activities"
    ADD CONSTRAINT "activities_jobcard_id_fkey" FOREIGN KEY ("jobcard_id") REFERENCES "tenant"."jobcards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tenant"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."customer_communications"
    ADD CONSTRAINT "customer_communications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."customer_communications"
    ADD CONSTRAINT "customer_communications_jobcard_id_fkey" FOREIGN KEY ("jobcard_id") REFERENCES "tenant"."jobcards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."customer_communications"
    ADD CONSTRAINT "customer_communications_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "tenant"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."customers"
    ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."dvi_checkpoints"
    ADD CONSTRAINT "dvi_checkpoints_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tenant"."dvi_checkpoint_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."dvi_checkpoints"
    ADD CONSTRAINT "dvi_checkpoints_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "tenant"."dvi_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."dvi_items"
    ADD CONSTRAINT "dvi_items_jobcard_id_fkey" FOREIGN KEY ("jobcard_id") REFERENCES "tenant"."jobcards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."dvi_photos"
    ADD CONSTRAINT "dvi_photos_dvi_item_id_fkey" FOREIGN KEY ("dvi_item_id") REFERENCES "tenant"."dvi_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."dvi_photos"
    ADD CONSTRAINT "dvi_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "tenant"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."estimate_items"
    ADD CONSTRAINT "estimate_items_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "tenant"."estimates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."estimate_items"
    ADD CONSTRAINT "estimate_items_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "tenant"."parts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."estimates"
    ADD CONSTRAINT "estimates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."estimates"
    ADD CONSTRAINT "estimates_jobcard_id_fkey" FOREIGN KEY ("jobcard_id") REFERENCES "tenant"."jobcards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."estimates"
    ADD CONSTRAINT "estimates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."estimates"
    ADD CONSTRAINT "estimates_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "tenant"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "tenant"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "tenant"."parts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."invoices"
    ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "tenant"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."invoices"
    ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."invoices"
    ADD CONSTRAINT "invoices_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "tenant"."estimates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."invoices"
    ADD CONSTRAINT "invoices_jobcard_id_fkey" FOREIGN KEY ("jobcard_id") REFERENCES "tenant"."jobcards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."invoices"
    ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."jobcards"
    ADD CONSTRAINT "jobcards_assigned_mechanic_id_fkey" FOREIGN KEY ("assigned_mechanic_id") REFERENCES "tenant"."mechanics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."jobcards"
    ADD CONSTRAINT "jobcards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant"."customers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "tenant"."jobcards"
    ADD CONSTRAINT "jobcards_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."jobcards"
    ADD CONSTRAINT "jobcards_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "tenant"."vehicles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "tenant"."mechanics"
    ADD CONSTRAINT "mechanics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."notifications"
    ADD CONSTRAINT "notifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."notifications"
    ADD CONSTRAINT "notifications_jobcard_id_fkey" FOREIGN KEY ("jobcard_id") REFERENCES "tenant"."jobcards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."notifications"
    ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tenant"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."part_usages"
    ADD CONSTRAINT "part_usages_jobcard_id_fkey" FOREIGN KEY ("jobcard_id") REFERENCES "tenant"."jobcards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."part_usages"
    ADD CONSTRAINT "part_usages_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "tenant"."parts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "tenant"."part_usages"
    ADD CONSTRAINT "part_usages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."parts"
    ADD CONSTRAINT "parts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "tenant"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "tenant"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."payments"
    ADD CONSTRAINT "payments_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "tenant"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."payments"
    ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."razorpay_settings"
    ADD CONSTRAINT "razorpay_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."users"
    ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."users"
    ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "tenant"."vehicles"
    ADD CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant"."customers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "tenant"."vehicles"
    ADD CONSTRAINT "vehicles_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "public"."vehicle_make"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."vehicles"
    ADD CONSTRAINT "vehicles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_model"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "tenant"."vehicles"
    ADD CONSTRAINT "vehicles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE;



CREATE POLICY "Tenant isolation" ON "tenant"."activities" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."customer_communications" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."customers" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."dvi_checkpoint_categories" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."dvi_checkpoints" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."dvi_templates" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."estimates" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."inventory_transactions" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."invoices" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."jobcards" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."mechanics" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."notifications" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."part_usages" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."parts" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."payments" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."settings" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Tenant isolation" ON "tenant"."vehicles" USING (("tenant_id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Users can insert own user record" ON "tenant"."users" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can insert tenants" ON "tenant"."tenants" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can select own or tenant users" ON "tenant"."users" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR ("tenant_id" = "tenant"."current_tenant_id"())));



CREATE POLICY "Users can select own tenant" ON "tenant"."tenants" FOR SELECT TO "authenticated" USING (("id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Users can update own tenant" ON "tenant"."tenants" FOR UPDATE TO "authenticated" USING (("id" = "tenant"."current_tenant_id"())) WITH CHECK (("id" = "tenant"."current_tenant_id"()));



CREATE POLICY "Users can update own user record" ON "tenant"."users" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "razorpay_settings_policy" ON "tenant"."razorpay_settings" USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_delete" ON "tenant"."customers" FOR DELETE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_delete" ON "tenant"."estimates" FOR DELETE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_delete" ON "tenant"."invoices" FOR DELETE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_delete" ON "tenant"."jobcards" FOR DELETE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_delete" ON "tenant"."mechanics" FOR DELETE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_delete" ON "tenant"."notifications" FOR DELETE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_delete" ON "tenant"."part_usages" FOR DELETE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_delete" ON "tenant"."parts" FOR DELETE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_delete" ON "tenant"."payments" FOR DELETE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_delete" ON "tenant"."vehicles" FOR DELETE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_insert" ON "tenant"."customers" FOR INSERT WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_insert" ON "tenant"."estimates" FOR INSERT WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_insert" ON "tenant"."invoices" FOR INSERT WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_insert" ON "tenant"."jobcards" FOR INSERT WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_insert" ON "tenant"."mechanics" FOR INSERT WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_insert" ON "tenant"."notifications" FOR INSERT WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_insert" ON "tenant"."part_usages" FOR INSERT WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_insert" ON "tenant"."parts" FOR INSERT WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_insert" ON "tenant"."payments" FOR INSERT WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_insert" ON "tenant"."vehicles" FOR INSERT WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_select" ON "tenant"."customers" FOR SELECT USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_select" ON "tenant"."estimates" FOR SELECT USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_select" ON "tenant"."invoices" FOR SELECT USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_select" ON "tenant"."jobcards" FOR SELECT USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_select" ON "tenant"."mechanics" FOR SELECT USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_select" ON "tenant"."notifications" FOR SELECT USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_select" ON "tenant"."part_usages" FOR SELECT USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_select" ON "tenant"."parts" FOR SELECT USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_select" ON "tenant"."payments" FOR SELECT USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_select" ON "tenant"."vehicles" FOR SELECT USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_update" ON "tenant"."customers" FOR UPDATE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_update" ON "tenant"."estimates" FOR UPDATE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_update" ON "tenant"."invoices" FOR UPDATE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_update" ON "tenant"."jobcards" FOR UPDATE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_update" ON "tenant"."mechanics" FOR UPDATE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_update" ON "tenant"."notifications" FOR UPDATE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_update" ON "tenant"."part_usages" FOR UPDATE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_update" ON "tenant"."parts" FOR UPDATE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_update" ON "tenant"."payments" FOR UPDATE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_isolation_update" ON "tenant"."vehicles" FOR UPDATE USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenant_payment_tx_policy" ON "tenant"."payment_transactions" USING ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"()))) WITH CHECK ((NOT ("tenant_id" IS DISTINCT FROM "tenant"."current_tenant"())));



CREATE POLICY "tenants_select_policy" ON "tenant"."tenants" FOR SELECT USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "app_tenant";
GRANT USAGE ON SCHEMA "public" TO "app_mechanic";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";



GRANT USAGE ON SCHEMA "tenant" TO "app_tenant";
GRANT USAGE ON SCHEMA "tenant" TO "app_mechanic";
GRANT USAGE ON SCHEMA "tenant" TO "authenticator";
GRANT USAGE ON SCHEMA "tenant" TO "service_role";
GRANT USAGE ON SCHEMA "tenant" TO "authenticated";
GRANT USAGE ON SCHEMA "tenant" TO "anon";

























































































































































GRANT ALL ON FUNCTION "public"."get_or_create_user_tenant"("user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."test_tenant_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_tenant_insert"() TO "anon";


















GRANT SELECT ON TABLE "public"."schema_migrations" TO "anon";
GRANT SELECT ON TABLE "public"."schema_migrations" TO "authenticated";



GRANT SELECT ON TABLE "public"."vehicle_category" TO "app_tenant";
GRANT SELECT ON TABLE "public"."vehicle_category" TO "app_mechanic";
GRANT SELECT ON TABLE "public"."vehicle_category" TO "anon";
GRANT SELECT ON TABLE "public"."vehicle_category" TO "authenticated";



GRANT SELECT ON TABLE "public"."vehicle_make" TO "app_tenant";
GRANT SELECT ON TABLE "public"."vehicle_make" TO "app_mechanic";
GRANT SELECT ON TABLE "public"."vehicle_make" TO "anon";
GRANT SELECT ON TABLE "public"."vehicle_make" TO "authenticated";



GRANT SELECT ON TABLE "public"."vehicle_model" TO "app_tenant";
GRANT SELECT ON TABLE "public"."vehicle_model" TO "app_mechanic";
GRANT SELECT ON TABLE "public"."vehicle_model" TO "anon";
GRANT SELECT ON TABLE "public"."vehicle_model" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."activities" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."activities" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."activities" TO "authenticated";
GRANT ALL ON TABLE "tenant"."activities" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."customer_communications" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."customer_communications" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."customer_communications" TO "authenticated";
GRANT ALL ON TABLE "tenant"."customer_communications" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."customers" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."customers" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."customers" TO "authenticated";
GRANT ALL ON TABLE "tenant"."customers" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."dvi_checkpoint_categories" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."dvi_checkpoint_categories" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."dvi_checkpoint_categories" TO "authenticated";
GRANT ALL ON TABLE "tenant"."dvi_checkpoint_categories" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."dvi_checkpoints" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."dvi_checkpoints" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."dvi_checkpoints" TO "authenticated";
GRANT ALL ON TABLE "tenant"."dvi_checkpoints" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."dvi_items" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."dvi_items" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."dvi_items" TO "authenticated";
GRANT ALL ON TABLE "tenant"."dvi_items" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."dvi_photos" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."dvi_photos" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."dvi_photos" TO "authenticated";
GRANT ALL ON TABLE "tenant"."dvi_photos" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."dvi_templates" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."dvi_templates" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."dvi_templates" TO "authenticated";
GRANT ALL ON TABLE "tenant"."dvi_templates" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."estimate_items" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."estimate_items" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."estimate_items" TO "authenticated";
GRANT ALL ON TABLE "tenant"."estimate_items" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."estimates" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."estimates" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."estimates" TO "authenticated";
GRANT ALL ON TABLE "tenant"."estimates" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."inventory_transactions" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."inventory_transactions" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."inventory_transactions" TO "authenticated";
GRANT ALL ON TABLE "tenant"."inventory_transactions" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."invoices" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."invoices" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."invoices" TO "authenticated";
GRANT ALL ON TABLE "tenant"."invoices" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."jobcards" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."jobcards" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."jobcards" TO "authenticated";
GRANT ALL ON TABLE "tenant"."jobcards" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."mechanics" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."mechanics" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."mechanics" TO "authenticated";
GRANT ALL ON TABLE "tenant"."mechanics" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."notifications" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."notifications" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."notifications" TO "authenticated";
GRANT ALL ON TABLE "tenant"."notifications" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."part_usages" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."part_usages" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."part_usages" TO "authenticated";
GRANT ALL ON TABLE "tenant"."part_usages" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."parts" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."parts" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."parts" TO "authenticated";
GRANT ALL ON TABLE "tenant"."parts" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."payment_transactions" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."payment_transactions" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "tenant"."payment_transactions" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."payments" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."payments" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."payments" TO "authenticated";
GRANT ALL ON TABLE "tenant"."payments" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."razorpay_settings" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."razorpay_settings" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."razorpay_settings" TO "authenticated";
GRANT ALL ON TABLE "tenant"."razorpay_settings" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."settings" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."settings" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."settings" TO "authenticated";
GRANT ALL ON TABLE "tenant"."settings" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."tenants" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."tenants" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."tenants" TO "service_role";
GRANT ALL ON TABLE "tenant"."tenants" TO "authenticated";
GRANT ALL ON TABLE "tenant"."tenants" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."users" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."users" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."users" TO "service_role";
GRANT ALL ON TABLE "tenant"."users" TO "authenticated";
GRANT ALL ON TABLE "tenant"."users" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."vehicles" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."vehicles" TO "app_mechanic";
GRANT ALL ON TABLE "tenant"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "tenant"."vehicles" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."v_vehicle_full" TO "app_tenant";
GRANT SELECT ON TABLE "tenant"."v_vehicle_full" TO "app_mechanic";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "tenant"."v_vehicle_full" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,USAGE ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,USAGE ON SEQUENCES TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT ON TABLES TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "tenant" GRANT SELECT,USAGE ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "tenant" GRANT SELECT,USAGE ON SEQUENCES TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "tenant" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "tenant" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "tenant" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "app_tenant";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "tenant" GRANT SELECT ON TABLES TO "app_mechanic";




























