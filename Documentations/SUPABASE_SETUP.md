# Wrench Cloud Supabase Integration Setup Guide

## Overview
This guide walks you through setting up Supabase for the Wrench Cloud garage management system.

## Prerequisites
- Supabase account (sign up at https://supabase.com)
- Node.js and pnpm installed
- Git

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Project name: `wrench-cloud`
   - Database password: (save this securely)
   - Region: (choose closest to your location)
4. Click "Create new project"
5. Wait for the project to be created (2-3 minutes)

## Step 2: Get API Keys

1. In your Supabase project dashboard, click "Settings" (gear icon)
2. Click "API" in the sidebar
3. Copy the following:
   - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - `service_role` key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!**

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```powershell
   Copy-Item .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

## Step 4: Set Up Database Schema

1. In Supabase dashboard, click "SQL Editor" in the sidebar
2. Click "New query"
3. Run the following SQL to create the schemas:

### Create Schemas
```sql
-- Create public schema tables (vehicle makes/models)
CREATE TABLE IF NOT EXISTS public.vehicle_make (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_model (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    make_id UUID REFERENCES public.vehicle_make(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    model_code TEXT,
    vehicle_category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tenant schema
CREATE SCHEMA IF NOT EXISTS tenant;

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenant.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create users table
CREATE TABLE IF NOT EXISTS tenant.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant.tenants(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'frontdesk',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS tenant.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS tenant.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES tenant.customers(id) ON DELETE CASCADE,
    reg_no TEXT NOT NULL,
    vin TEXT,
    make_id UUID REFERENCES public.vehicle_make(id),
    model_id UUID REFERENCES public.vehicle_model(id),
    year INTEGER,
    odometer INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mechanics table
CREATE TABLE IF NOT EXISTS tenant.mechanics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES tenant.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    specialty TEXT,
    employee_id TEXT,
    total_jobs INTEGER DEFAULT 0,
    active_jobs INTEGER DEFAULT 0,
    avg_job_time INTERVAL,
    rating DECIMAL(3,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create jobcards table
CREATE TABLE IF NOT EXISTS tenant.jobcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    job_number TEXT NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES tenant.vehicles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES tenant.customers(id) ON DELETE CASCADE,
    assigned_mechanic_id UUID REFERENCES tenant.mechanics(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'received',
    complaints TEXT NOT NULL,
    notes TEXT,
    dvi_pending BOOLEAN DEFAULT false,
    dvi_template_id UUID,
    estimated_completion TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    labor_total DECIMAL(10,2) DEFAULT 0,
    parts_total DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create parts table
CREATE TABLE IF NOT EXISTS tenant.parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    stock_keeping_unit TEXT,
    name TEXT NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    sell_price DECIMAL(10,2) DEFAULT 0,
    stock_on_hand INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    category TEXT,
    supplier TEXT,
    barcode TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create part_usages table
CREATE TABLE IF NOT EXISTS tenant.part_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    jobcard_id UUID NOT NULL REFERENCES tenant.jobcards(id) ON DELETE CASCADE,
    part_id UUID REFERENCES tenant.parts(id) ON DELETE SET NULL,
    custom_name TEXT,
    custom_part_number TEXT,
    qty INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) GENERATED ALWAYS AS (qty * unit_price + labor_cost) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS tenant.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    jobcard_id UUID NOT NULL REFERENCES tenant.jobcards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tenant.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dvi_templates table
CREATE TABLE IF NOT EXISTS tenant.dvi_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dvi_items table
CREATE TABLE IF NOT EXISTS tenant.dvi_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jobcard_id UUID NOT NULL REFERENCES tenant.jobcards(id) ON DELETE CASCADE,
    checkpoint_id UUID NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS tenant.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    sms_enabled BOOLEAN DEFAULT false,
    email_enabled BOOLEAN DEFAULT false,
    whatsapp_enabled BOOLEAN DEFAULT false,
    invoice_prefix TEXT DEFAULT 'INV-',
    job_prefix TEXT DEFAULT 'JOB-',
    estimate_prefix TEXT DEFAULT 'EST-',
    invoice_footer TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Create RLS Policies
```sql
-- Enable RLS on all tenant tables
ALTER TABLE tenant.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.jobcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.part_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.dvi_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.dvi_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.settings ENABLE ROW LEVEL SECURITY;

-- Create function to get current tenant
CREATE OR REPLACE FUNCTION tenant.current_tenant_id()
RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.tenant_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- Create RLS policies for each table
CREATE POLICY "Tenant isolation" ON tenant.customers
    USING (tenant_id = tenant.current_tenant_id());

CREATE POLICY "Tenant isolation" ON tenant.vehicles
    USING (tenant_id = tenant.current_tenant_id());

CREATE POLICY "Tenant isolation" ON tenant.mechanics
    USING (tenant_id = tenant.current_tenant_id());

CREATE POLICY "Tenant isolation" ON tenant.jobcards
    USING (tenant_id = tenant.current_tenant_id());

CREATE POLICY "Tenant isolation" ON tenant.parts
    USING (tenant_id = tenant.current_tenant_id());

CREATE POLICY "Tenant isolation" ON tenant.part_usages
    USING (tenant_id = tenant.current_tenant_id());

CREATE POLICY "Tenant isolation" ON tenant.activities
    USING (tenant_id = tenant.current_tenant_id());

CREATE POLICY "Tenant isolation" ON tenant.dvi_templates
    USING (tenant_id = tenant.current_tenant_id());

CREATE POLICY "Tenant isolation" ON tenant.users
    USING (tenant_id = tenant.current_tenant_id());

CREATE POLICY "Tenant isolation" ON tenant.settings
    USING (tenant_id = tenant.current_tenant_id());
```

### Create Helper Functions
```sql
-- Function to set tenant context (called from application)
CREATE OR REPLACE FUNCTION set_config(parameter text, value text)
RETURNS void AS $$
BEGIN
    PERFORM set_config(parameter, value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 5: Insert Sample Data

```sql
-- Insert sample vehicle makes
INSERT INTO public.vehicle_make (name, code) VALUES
    ('Honda', 'HON'),
    ('Toyota', 'TOY'),
    ('Maruti Suzuki', 'MAR'),
    ('Hyundai', 'HYU'),
    ('Tata', 'TAT');

-- Insert sample vehicle models
WITH honda AS (SELECT id FROM public.vehicle_make WHERE code = 'HON'),
     toyota AS (SELECT id FROM public.vehicle_make WHERE code = 'TOY'),
     maruti AS (SELECT id FROM public.vehicle_make WHERE code = 'MAR')
INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
    ((SELECT id FROM honda), 'City', 'CTY', 'Sedan'),
    ((SELECT id FROM honda), 'Amaze', 'AMZ', 'Sedan'),
    ((SELECT id FROM toyota), 'Fortuner', 'FOR', 'SUV'),
    ((SELECT id FROM maruti), 'Swift', 'SWT', 'Hatchback');

-- Create a demo tenant
INSERT INTO tenant.tenants (id, name, slug) VALUES
    ('123e4567-e89b-12d3-a456-426614174000'::uuid, 'Demo Garage', 'demo-garage');
```

## Step 6: Install Dependencies

```powershell
pnpm install @supabase/supabase-js
```

## Step 7: Run the Application

```powershell
pnpm dev
```

## Step 8: Test the Integration

1. Open http://localhost:3000
2. You should see the login page
3. Create a test user in Supabase:
   - Go to Authentication > Users
   - Click "Add user"
   - Enter email and password
   - Click "Create user"

4. After creating the user, you need to link them to the tenant:
   ```sql
   -- Replace with your actual user ID and tenant ID
   INSERT INTO tenant.users (tenant_id, auth_user_id, name, email, role)
   VALUES (
       '123e4567-e89b-12d3-a456-426614174000'::uuid, -- demo tenant ID
       'your-auth-user-id-here'::uuid, -- from auth.users
       'Test User',
       'test@example.com',
       'frontdesk'
   );
   ```

5. Set the tenant context in your application by calling:
   ```typescript
   await setTenantContext('123e4567-e89b-12d3-a456-426614174000')
   ```

## Troubleshooting

### Issue: "relation does not exist"
- Make sure you ran all the SQL commands in the correct order
- Check that schemas are created (`public` and `tenant`)

### Issue: "RLS policy violation"
- Ensure you're calling `setTenantContext()` after authentication
- Check that the tenant ID is valid

### Issue: "Cannot read properties of null"
- Make sure environment variables are set correctly
- Restart the dev server after changing `.env.local`

## Next Steps

1. Create additional test data (customers, vehicles, jobs)
2. Set up Supabase Storage for DVI photos
3. Configure email templates for notifications
4. Set up database backups

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
