# Architecture

Technical architecture overview for Wrench Cloud.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Tenant Portal  │  │  Admin Portal   │  │  Mechanic   │ │
│  │  (subdomain)    │  │  (/admin)       │  │  (/mechanic)│ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
└───────────┼─────────────────────┼─────────────────┼─────────┘
            │                     │                 │
            ▼                     ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Middleware (Subdomain Routing)              ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ /(tenant)   │  │ /(admin)    │  │ /api/*              │ │
│  │ Route Group │  │ Route Group │  │ API Routes          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
            │                     │                 │
            ▼                     ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Domain Modules                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Customer │ │ Vehicle  │ │   Job    │ │   Invoice     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
            │                     │                 │
            ▼                     ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  PostgreSQL     │  │  Auth           │  │  Storage    │ │
│  │  (RLS Enabled)  │  │  (JWT + Claims) │  │  (Files)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Layers

### 1. Presentation Layer

**Location**: `src/app/`, `src/components/`

| Route Group | Purpose | Access |
|-------------|---------|--------|
| `/(tenant)` | Main tenant workspace | Authenticated tenant users |
| `/(admin)` | Platform administration | Platform admins only |
| `/(mechanic)` | Mechanic-specific views | Mechanic role |
| `/api` | REST API endpoints | Authenticated requests |

**Key Files**:
- `src/app/(tenant)/layout.tsx` - Tenant layout with sidebar
- `src/app/(admin)/layout.tsx` - Admin layout
- `src/components/tenant/` - Tenant-specific components

### 2. API Layer

**Location**: `src/app/api/`

All API routes follow this pattern:

```typescript
// GET /api/customers
export async function GET(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. Get tenant context
  const tenantId = user.app_metadata.tenant_id;
  
  // 3. Execute use case
  const repository = new SupabaseCustomerRepository(supabase, tenantId);
  const useCase = new GetAllCustomersUseCase(repository);
  const customers = await useCase.execute();
  
  // 4. Return response
  return NextResponse.json(customers);
}
```

### 3. Application Layer (Use Cases)

**Location**: `src/modules/*/application/`

Use cases encapsulate business logic:

```typescript
// src/modules/customer/application/create-customer.use-case.ts
export class CreateCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(input: CreateCustomerInput): Promise<Customer> {
    // Validate business rules
    // Call repository
    // Return result
  }
}
```

### 4. Domain Layer

**Location**: `src/modules/*/domain/`

Contains entities and types:

```typescript
// src/modules/customer/domain/customer.entity.ts
export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### 5. Infrastructure Layer

**Location**: `src/modules/*/infrastructure/`

Repository implementations:

```typescript
// src/modules/customer/infrastructure/customer.repository.supabase.ts
export class SupabaseCustomerRepository implements CustomerRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string
  ) {}

  async findAll(): Promise<Customer[]> {
    const { data } = await this.supabase
      .schema('tenant')
      .from('customers')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .is('deleted_at', null);
    
    return data.map(toDomain);
  }
}
```

---

## Multi-Tenancy

### 1. Subdomain Routing

```
tenant-slug.wrenchcloud.com → Tenant workspace
wrenchcloud.com/admin → Admin portal
```

Handled by middleware in `src/lib/supabase/proxy.ts`

### 2. JWT Claims

Every authenticated user has claims:

```json
{
  "role": "tenant",
  "tenant_id": "uuid-here"
}
```

Set via `src/modules/access/application/jwt-claim.service.ts`

### 3. Row Level Security (RLS)

All tenant tables have RLS policies:

```sql
CREATE POLICY customers_select ON tenant.customers
FOR SELECT USING (
  (auth.jwt() ->> 'role') = 'platform_admin'
  OR
  (auth.jwt() ->> 'tenant_id') = tenant_id::text
);
```

---

## Database Schema

### Schemas

| Schema | Purpose |
|--------|---------|
| `public` | Shared reference data (vehicle makes, models) |
| `tenant` | Tenant-isolated business data |
| `auth` | Supabase auth (managed) |

### Key Tables

```
tenant schema:
├── tenants          # Tenant organizations
├── users            # Tenant users (linked to auth.users)
├── customers        # Customer records
├── vehicles         # Customer vehicles
├── jobcards         # Job cards / work orders
├── estimates        # Cost estimates
├── estimate_items   # Line items for estimates
├── invoices         # Generated invoices
└── payment_transactions  # Payment records

public schema:
├── vehicle_category # Vehicle types (car, bike, truck)
├── vehicle_make     # Manufacturers (Toyota, Honda)
├── vehicle_model    # Specific models
└── platform_admins  # Platform admin users
```

---

## Authentication Flow

```
1. User visits tenant.wrenchcloud.com
          │
          ▼
2. Middleware checks session
          │
          ▼
3. No session? Redirect to /login
          │
          ▼
4. User submits credentials
          │
          ▼
5. POST /api/auth/login
          │
          ▼
6. Supabase validates → Returns JWT
          │
          ▼
7. JWT contains: role, tenant_id
          │
          ▼
8. All queries filtered by tenant_id (RLS)
```

---

## Auth Routing Rules

> ⚠️ **READ BEFORE CHANGING AUTH**

### Core Principles (Non-Negotiable)

1. **Server is authoritative for auth** - Client auth state is eventually consistent
2. **Layouts must NEVER block rendering** - No loaders, no `return null`, no waiting
3. **Only ONE place decides routing** - `/auth/resolve`
4. **Layouts enforce access — they do NOT route** - Never redirect to `/login`

### Auth Flow

```
Login Page → POST /api/auth/login → /auth/resolve → Dashboard
```

- `/api/auth/login` - Sets session cookie, never redirects
- `/api/auth/me` - Returns authenticated user from cookies
- `/auth/resolve` - The ONLY routing decision point
- Layouts - Render UI shell, redirect to `/auth/no-access` if wrong role

### What MUST NOT Be Done

❌ Redirect to `/login` from layouts  
❌ Use `loading` to block layouts  
❌ `return null` in layouts based on auth  
❌ Decide routing in AuthProvider  
❌ Depend on `user` immediately after login  

---

## Key Patterns

### Repository Pattern

- Interface defines contract
- Implementation is swappable
- Currently: Supabase implementation

### Use Case Pattern

- One class per business operation
- Single execute() method
- Easy to test in isolation

### Soft Delete

All deletable entities use:

```typescript
deletedAt: Date | null;
deletedBy: string | null;
```

Queries always filter: `.is('deleted_at', null)`

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `CustomerCard.tsx` |
| Hooks | camelCase with use | `useCustomers.ts` |
| Use Cases | kebab-case | `create-customer.use-case.ts` |
| Repositories | kebab-case | `customer.repository.supabase.ts` |
| Entities | kebab-case | `customer.entity.ts` |
| API Routes | route.ts | `route.ts` |

---

## Dependencies

### Core

| Package | Purpose |
|---------|---------|
| next | React framework |
| @supabase/supabase-js | Database client |
| @tanstack/react-query | Server state management |

### UI

| Package | Purpose |
|---------|---------|
| tailwindcss | Styling |
| @radix-ui/* | Accessible primitives |
| lucide-react | Icons |

### Utilities

| Package | Purpose |
|---------|---------|
| zod | Schema validation |
| date-fns | Date utilities |
