# Supabase Services Update Summary

## Overview
All Supabase services have been updated to match the actual database schema defined in `lib/supabase/schemas/tenant.schema.sql` and `lib/supabase/schemas/public.schema.sql`.

## Schema Architecture

### Public Schema (Reference Data)
- `vehicle_category` - Vehicle categories (Car, Bike, Commercial)
- `vehicle_make` - Vehicle manufacturers
- `vehicle_model` - Vehicle models (FK to make)

### Tenant Schema (Multi-tenant Data - 23 Tables)
Core business entities with tenant isolation via `tenant_id` foreign key.

## Critical Schema Changes Applied

### 1. Job Management
- **Old**: `jobs` table, `job_items` for parts
- **New**: `jobcards` table, `part_usages` for parts
- Fields: `job_number`, `status` (text), `details` (jsonb)

### 2. Vehicle Management
- **Old**: `registration_number` field
- **New**: `reg_no` field
- Added FK relations: `make_id`, `model_id` → public schema

### 3. Mechanic Management
- **Old**: Users table with `role='mechanic'` filter
- **New**: Separate `mechanics` table
- Fields: `skills` (text[]), `hourly_rate` (numeric)

### 4. Customer Management
- Simplified structure: `name`, `phone`, `email`, `address`, `notes`
- Removed fields: `city`, `state`, `pincode`, `gst_number`

## Services Created/Updated

### ✅ Updated Services (5)

#### 1. JobService (`job.service.ts`)
```typescript
- Uses 'jobcards' table instead of 'jobs'
- JobcardWithRelations includes vehicle with make/model
- addPartUsages() for parts management
- Real-time subscriptions for jobcard updates
```

#### 2. VehicleService (`vehicle.service.ts`)
```typescript
- Uses 'reg_no' field instead of 'registration_number'
- VehicleWithRelations includes make/model from public schema
- searchByRegNo() method for vehicle lookup
```

#### 3. MechanicService (`mechanic.service.ts`)
```typescript
- Queries separate 'mechanics' table
- Includes skills array and hourly_rate
- getMechanicsBySkill() for filtering
```

#### 4. CustomerService (`customer.service.ts`)
```typescript
- Simplified customer fields matching schema
- CustomerWithVehicles includes vehicle relations
- searchCustomers() for phone/email lookup
```

#### 5. DVIService (`dvi.service.ts`)
```typescript
- DVI templates with checkpoint categories
- DVIItemWithPhotos for inspection records
- Jobcard association for vehicle inspections
```

### ✅ New Services Created (4)

#### 6. PartsService (`parts.service.ts`)
```typescript
Features:
- Full parts inventory management
- Stock tracking with reorder_level alerts
- Inventory transactions (in/out/adjustment)
- Auto-update stock on transactions
- Low stock parts query
- Part search by name/SKU

Key Methods:
- getParts() - List all parts
- searchParts(query) - Search by name/SKU/description
- getLowStockParts() - Parts below reorder level
- addInventoryTransaction() - Stock movements
- getPartTransactions() - Transaction history
```

#### 7. EstimateService (`estimate.service.ts`)
```typescript
Features:
- Estimate creation with line items
- Approval/rejection workflow
- Customer/vehicle relations
- Status tracking (draft/sent/approved/rejected)

Key Methods:
- getEstimates(status?) - Filter by status
- addEstimateItems() - Add line items
- approveEstimate() - Mark approved with timestamp
- rejectEstimate() - Mark rejected with reason
```

#### 8. InvoiceService (`invoice.service.ts`)
```typescript
Features:
- Invoice generation from jobcards
- Payment tracking (paid_amount, balance)
- Status management (pending/partial/paid)
- Overdue invoice detection
- Customer/jobcard relations

Key Methods:
- getInvoices(status?) - Filter by payment status
- addPayment() - Record payment and update balance
- getInvoicePayments() - Payment history
- getOverdueInvoices() - Past due invoices
```

#### 9. PaymentService (`payment.service.ts`)
```typescript
Features:
- Multi-mode payments (cash/razorpay/card/upi)
- Razorpay gateway integration
- Payment transaction tracking
- Gateway response storage

Key Methods:
- createPayment() - Record payment
- addPaymentTransaction() - Gateway transaction
- initiateRazorpayPayment() - Start Razorpay flow
- completeRazorpayPayment() - Complete with status
- getPaymentTransactions() - Transaction history
```

## Type Definitions (`types.ts`)

Generated complete TypeScript definitions for:
- 23 tenant schema tables
- 3 public schema tables
- Row, Insert, Update types for each table
- Proper FK relationship types

## Service Index (`services/index.ts`)

Central export point for all services:
```typescript
export { JobService } from './job.service'
export { CustomerService } from './customer.service'
export { VehicleService } from './vehicle.service'
export { MechanicService } from './mechanic.service'
export { DVIService } from './dvi.service'
export { PartsService } from './parts.service'
export { EstimateService } from './estimate.service'
export { InvoiceService } from './invoice.service'
export { PaymentService } from './payment.service'
```

## Usage Pattern

All services follow consistent patterns:

### 1. Tenant Context
```typescript
const tenantId = ensureTenantContext() // Required for all operations
```

### 2. Query Pattern
```typescript
const { data, error } = await supabase
  .schema('tenant')
  .from('table_name')
  .select('*')
  .eq('tenant_id', tenantId)
```

### 3. Relations
```typescript
.select(`
  *,
  customer:customers(*),
  vehicle:vehicles(
    *,
    make:vehicle_make(*),
    model:vehicle_model(*)
  )
`)
```

### 4. Error Handling
```typescript
if (error) throw error
return data
```

## Testing

Test the services at: `/test-connection`

The test page verifies:
1. Supabase client connection
2. Schema exposure (tenant schema visible)
3. Authentication status
4. Environment variables

## Next Steps

1. **RLS Implementation**: Add Row Level Security policies to tenant schema tables
2. **Realtime Subscriptions**: Add real-time listeners for jobcards, invoices, payments
3. **Validation**: Add Zod schemas for input validation
4. **Error Handling**: Implement custom error classes for better error messages
5. **Caching**: Add React Query for client-side caching
6. **UI Integration**: Connect services to existing UI components

## Files Modified

### Created
- `lib/supabase/services/parts.service.ts`
- `lib/supabase/services/estimate.service.ts`
- `lib/supabase/services/invoice.service.ts`
- `lib/supabase/services/payment.service.ts`

### Updated
- `lib/supabase/types.ts` - Complete regeneration with all 26 tables
- `lib/supabase/services/job.service.ts` - jobs → jobcards
- `lib/supabase/services/vehicle.service.ts` - reg_no field, make/model FKs
- `lib/supabase/services/mechanic.service.ts` - separate mechanics table
- `lib/supabase/services/customer.service.ts` - simplified fields
- `lib/supabase/services/index.ts` - export all services

## Schema Alignment Verification

All services now use:
- ✅ Correct table names from schema
- ✅ Correct field names (reg_no, job_number, etc.)
- ✅ Proper FK relations (make_id, model_id to public schema)
- ✅ Tenant isolation via tenant_id filter
- ✅ TypeScript types matching Database interface

## Important Notes

1. **Tenant Context Required**: All service calls must have tenant context set via `setTenantContext(tenantId)`
2. **Schema Exposure**: Ensure `TENANT` schema is in `exposed_schemas` in Supabase dashboard
3. **Permissions**: Grant appropriate permissions to `anon` and `authenticated` roles
4. **Environment**: Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

## Database Schema Summary

### Tenant Schema Tables (23)
1. tenants
2. users
3. customers
4. vehicles
5. mechanics
6. jobcards
7. estimates
8. estimate_items
9. invoices
10. parts
11. part_usages
12. inventory_transactions
13. payments
14. payment_transactions
15. dvi_templates
16. dvi_checkpoint_categories
17. dvi_checkpoints
18. dvi_items
19. dvi_photos
20. activities
21. notifications
22. customer_communications
23. settings
24. razorpay_settings

### Public Schema Tables (3)
1. vehicle_category
2. vehicle_make
3. vehicle_model
