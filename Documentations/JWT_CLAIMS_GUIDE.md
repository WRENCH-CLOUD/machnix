# JWT Claims Implementation Guide

This document explains how JWT claims work in our application and how they integrate with Supabase Row Level Security (RLS).

## Table of Contents
1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [JWT Claim Structure](#jwt-claim-structure)
4. [Role Definitions](#role-definitions)
5. [Setting JWT Claims](#setting-jwt-claims)
6. [RLS Policy Patterns](#rls-policy-patterns)
7. [Implementation Examples](#implementation-examples)
8. [Security Considerations](#security-considerations)
9. [Testing](#testing)

---

## Overview

Our application uses JWT (JSON Web Token) claims to enforce authorization and data isolation at the database level through Supabase Row Level Security (RLS). This ensures that:

- Users can only access data within their tenant
- Platform admins can access data across all tenants
- Different roles have appropriate permissions

**Key Principle**: JWT claims are the **single source of truth** for authorization in RLS policies.

---

## How It Works

### The Complete Flow

```
1. Server creates user → 2. Sets app_metadata → 3. Supabase embeds in JWT → 4. RLS uses JWT claims
```

### Detailed Steps

#### 1. **User Creation** (Server-side with service_role key)

When creating a user, we use the Supabase Admin API:

```typescript
const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password123',
  email_confirm: true,
  user_metadata: {
    name: 'John Doe',
    phone: '+1234567890'
  }
})
```

#### 2. **Setting JWT Claims** (Immediately after user creation)

We set the user's role and tenant_id in their `app_metadata`:

```typescript
import { setTenantUserClaims } from '@/lib/auth/set-jwt-claims'
import { JWT_ROLES } from '@/lib/auth/jwt-claims'

await setTenantUserClaims(
  supabaseAdmin,
  authUser.user.id,
  JWT_ROLES.TENANT_OWNER,
  tenantId
)
```

**What happens internally:**
```typescript
// This calls:
await supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: {
    role: 'tenant_owner',
    tenant_id: '<tenant-uuid>'
  }
})
```

#### 3. **JWT Embedding** (Automatic by Supabase)

Supabase automatically embeds `app_metadata` into the user's JWT. The JWT payload looks like:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "tenant_owner",          // ← From app_metadata
  "tenant_id": "tenant-uuid",       // ← From app_metadata
  "iat": 1234567890,
  "exp": 1234567890
}
```

#### 4. **RLS Policy Enforcement** (Automatic by PostgreSQL)

When the user makes a query, PostgreSQL evaluates RLS policies using the JWT:

```sql
CREATE POLICY customers_select
  ON tenant.customers
  FOR SELECT
  USING (
    -- Check if JWT role is platform_admin
    (auth.jwt() ->> 'role') = 'platform_admin'
    OR
    -- Or check if JWT tenant_id matches row tenant_id
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );
```

**Flow Diagram:**

```
User Login
    ↓
Supabase Auth validates credentials
    ↓
Returns JWT with embedded app_metadata
    ↓
Client includes JWT in all requests
    ↓
Database extracts claims via auth.jwt()
    ↓
RLS policies evaluate (USING clause)
    ↓
Only matching rows returned
```

---

## JWT Claim Structure

### Claim Keys

We use these exact keys (defined in `lib/auth/jwt-claims.ts`):

```typescript
export const JWT_CLAIM_ROLE = 'role'           // User's role
export const JWT_CLAIM_TENANT_ID = 'tenant_id' // User's tenant (if applicable)
```

### TypeScript Interface

```typescript
interface JwtAppMetadata {
  role: JwtRole                    // Required: user's role
  tenant_id?: string               // Optional: tenant UUID (required for tenant-scoped roles)
}
```

### Example JWT Claims

**Tenant Owner:**
```json
{
  "role": "tenant_owner",
  "tenant_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Platform Admin:**
```json
{
  "role": "platform_admin"
  // No tenant_id - platform admins are not scoped to a tenant
}
```

**Mechanic:**
```json
{
  "role": "mechanic",
  "tenant_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

## Role Definitions

### Global Roles (No tenant_id)

| Role | Value | Description | Access Scope |
|------|-------|-------------|--------------|
| Service Role | `service_role` | Backend service with unlimited access | **All data, bypasses RLS** |
| Platform Admin | `platform_admin` | Super admin managing the platform | **All tenants** |

### Tenant-Scoped Roles (Require tenant_id)

| Role | Value | Description | Access Level |
|------|-------|-------------|--------------|
| Tenant Owner | `tenant_owner` | Primary owner of a tenant | Full admin within tenant |
| Tenant Admin | `tenant_admin` | Administrator within tenant | Full admin within tenant |
| Manager | `manager` | Manages jobs, customers, reports | Manage resources within tenant |
| Mechanic | `mechanic` | Technical staff working on vehicles | Work on jobs within tenant |
| Front Desk | `frontdesk` | Reception/customer service | Create jobs, interact with customers |
| Employee | `employee` | General employee | Limited/read-only access |

### Role Groups (for RLS policies)

```typescript
// Privileged roles that bypass tenant isolation
PRIVILEGED_ROLES = ['service_role', 'platform_admin']

// Tenant admin roles
TENANT_ADMIN_ROLES = ['tenant_owner', 'tenant_admin']

// Tenant manager roles
TENANT_MANAGER_ROLES = ['tenant_owner', 'tenant_admin', 'manager']

// All tenant roles
TENANT_ROLES = ['tenant_owner', 'tenant_admin', 'manager', 'mechanic', 'frontdesk', 'employee']
```

---

## Setting JWT Claims

### Available Functions

All functions are in `lib/auth/set-jwt-claims.ts`:

#### 1. **setUserJwtClaims** (Generic)

```typescript
import { setUserJwtClaims } from '@/lib/auth/set-jwt-claims'
import { JWT_ROLES } from '@/lib/auth/jwt-claims'

const result = await setUserJwtClaims(supabaseAdmin, userId, {
  role: JWT_ROLES.TENANT_OWNER,
  tenant_id: tenantId
})

if (result.success) {
  console.log('Claims set successfully')
} else {
  console.error('Error:', result.error)
}
```

#### 2. **setTenantUserClaims** (For tenant users)

Convenience wrapper that ensures tenant_id is provided:

```typescript
import { setTenantUserClaims } from '@/lib/auth/set-jwt-claims'
import { JWT_ROLES } from '@/lib/auth/jwt-claims'

await setTenantUserClaims(
  supabaseAdmin,
  userId,
  JWT_ROLES.MECHANIC,
  tenantId
)
```

#### 3. **setPlatformAdminClaims** (For platform admins)

Convenience wrapper for platform admins:

```typescript
import { setPlatformAdminClaims } from '@/lib/auth/set-jwt-claims'

await setPlatformAdminClaims(supabaseAdmin, userId)
```

#### 4. **updateUserRole** (Change role, keep tenant_id)

Update role within the same tenant:

```typescript
import { updateUserRole } from '@/lib/auth/set-jwt-claims'
import { JWT_ROLES } from '@/lib/auth/jwt-claims'

// Promote mechanic to manager
await updateUserRole(supabaseAdmin, userId, JWT_ROLES.MANAGER)
```

#### 5. **getUserJwtClaims** (Get current claims)

```typescript
import { getUserJwtClaims } from '@/lib/auth/set-jwt-claims'

const claims = await getUserJwtClaims(supabaseAdmin, userId)
console.log(claims.role, claims.tenant_id)
```

#### 6. **clearUserJwtClaims** (Remove all claims)

```typescript
import { clearUserJwtClaims } from '@/lib/auth/set-jwt-claims'

await clearUserJwtClaims(supabaseAdmin, userId)
```

### When to Set Claims

**ALWAYS set JWT claims immediately after creating a user:**

```typescript
// ❌ WRONG - User has no claims
const { data: user } = await supabaseAdmin.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password'
})

// ✅ CORRECT - Set claims immediately
const { data: user } = await supabaseAdmin.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password'
})

await setTenantUserClaims(
  supabaseAdmin,
  user.user.id,
  JWT_ROLES.TENANT_OWNER,
  tenantId
)
```

---

## RLS Policy Patterns

### Basic Patterns

#### 1. **Privileged Access** (service_role, platform_admin)

```sql
USING (
  (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
)
```

#### 2. **Tenant Isolation** (Match tenant_id)

```sql
USING (
  (auth.jwt() ->> 'tenant_id') = tenant_id::text
)
```

#### 3. **Combined** (Privileged OR Tenant)

```sql
USING (
  -- Privileged roles have access
  (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
  OR
  -- Tenant users can access their own data
  (auth.jwt() ->> 'tenant_id') = tenant_id::text
)
```

#### 4. **Role-Specific Within Tenant**

```sql
USING (
  (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
  OR
  (
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
    AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin')
  )
)
```

### Complete Policy Example

```sql
-- Enable RLS
ALTER TABLE tenant.customers ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY customers_select
  ON tenant.customers
  FOR SELECT
  USING (
    -- Global admins can see all
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    -- Tenant users can see their tenant's customers
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

-- INSERT policy
CREATE POLICY customers_insert
  ON tenant.customers
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

-- UPDATE policy
CREATE POLICY customers_update
  ON tenant.customers
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );

-- DELETE policy
CREATE POLICY customers_delete
  ON tenant.customers
  FOR DELETE
  USING (
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    (
      (auth.jwt() ->> 'tenant_id') = tenant_id::text
      AND (auth.jwt() ->> 'role') IN ('tenant_owner', 'tenant_admin')
    )
  );
```

---

## Implementation Examples

### Example 1: Creating a Tenant with Owner

```typescript
// app/api/admin/tenants/create/route.ts
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { setTenantUserClaims } from '@/lib/auth/set-jwt-claims'
import { JWT_ROLES } from '@/lib/auth/jwt-claims'

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const body = await request.json()

  // 1. Create tenant
  const { data: tenant } = await supabaseAdmin
    .schema('tenant')
    .from('tenants')
    .insert({ name: body.tenantName, slug: body.slug })
    .select()
    .single()

  // 2. Create auth user
  const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
    email: body.adminEmail,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      name: body.adminName
    }
  })

  // 3. Set JWT claims (CRITICAL STEP!)
  await setTenantUserClaims(
    supabaseAdmin,
    authUser.user.id,
    JWT_ROLES.TENANT_OWNER,
    tenant.id
  )

  // 4. Create tenant.users record
  await supabaseAdmin
    .schema('tenant')
    .from('users')
    .insert({
      tenant_id: tenant.id,
      auth_user_id: authUser.user.id,
      name: body.adminName,
      email: body.adminEmail,
      role: 'tenant' // This is for tenant.users table, not JWT
    })

  return NextResponse.json({ success: true })
}
```

### Example 2: Creating a Platform Admin

```typescript
// scripts/create-platform-admin.ts
import { createClient } from '@supabase/supabase-js'
import { setPlatformAdminClaims } from '../lib/auth/set-jwt-claims'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function createPlatformAdmin() {
  // 1. Create auth user
  const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@platform.com',
    password: 'secure-password',
    email_confirm: true,
    user_metadata: {
      name: 'Platform Admin'
    }
  })

  // 2. Set JWT claims
  await setPlatformAdminClaims(supabaseAdmin, authUser.user.id)

  // 3. Create platform_admins record
  await supabaseAdmin
    .from('platform_admins')
    .insert({
      auth_user_id: authUser.user.id,
      name: 'Platform Admin',
      email: 'admin@platform.com',
      role: 'admin',
      is_active: true
    })

  console.log('Platform admin created!')
}

createPlatformAdmin()
```

### Example 3: Adding a Mechanic to Tenant

```typescript
// app/api/tenant/users/create/route.ts
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { setTenantUserClaims } from '@/lib/auth/set-jwt-claims'
import { JWT_ROLES } from '@/lib/auth/jwt-claims'

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const body = await request.json()

  // Assume we get tenant_id from authenticated user context
  const tenantId = body.tenant_id

  // 1. Create auth user
  const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: false, // Send email verification
    user_metadata: {
      name: body.name
    }
  })

  // 2. Set JWT claims for mechanic
  await setTenantUserClaims(
    supabaseAdmin,
    authUser.user.id,
    JWT_ROLES.MECHANIC,
    tenantId
  )

  // 3. Create tenant.users record
  await supabaseAdmin
    .schema('tenant')
    .from('users')
    .insert({
      tenant_id: tenantId,
      auth_user_id: authUser.user.id,
      name: body.name,
      email: body.email,
      role: 'mechanic'
    })

  return NextResponse.json({ success: true })
}
```

---

## Security Considerations

### ✅ DO's

1. **Always use service_role key** when setting JWT claims
   - Only server-side code with service_role can modify app_metadata
   - Never expose service_role key to clients

2. **Set claims immediately after user creation**
   - User creation and claim setting should be atomic
   - Implement rollback if claim setting fails

3. **Validate role and tenant_id before setting**
   - Use provided validation functions
   - Ensure tenant_id is a valid UUID
   - Ensure role requires tenant_id when necessary

4. **Test RLS policies thoroughly**
   - Test each role type
   - Test cross-tenant access prevention
   - Test privileged role access

### ❌ DON'Ts

1. **Never let clients set their own JWT claims**
   ```typescript
   // ❌ NEVER do this from client code
   supabase.auth.admin.updateUserById(userId, {
     app_metadata: { role: 'platform_admin' }
   })
   ```

2. **Don't store sensitive data in user_metadata**
   - user_metadata is readable by the user
   - Only app_metadata is secure

3. **Don't skip JWT claim validation**
   ```typescript
   // ❌ WRONG - No validation
   await supabaseAdmin.auth.admin.updateUserById(userId, {
     app_metadata: { role: 'invalid_role' }
   })

   // ✅ CORRECT - Use helper functions with validation
   await setUserJwtClaims(supabaseAdmin, userId, {
     role: JWT_ROLES.TENANT_OWNER,
     tenant_id: tenantId
   })
   ```

4. **Don't forget to update JWT claims when roles change**
   ```typescript
   // When promoting a user, update their JWT
   await updateUserRole(supabaseAdmin, userId, JWT_ROLES.MANAGER)
   ```

### Important Security Notes

- **JWT Refresh**: When app_metadata changes, the JWT is automatically refreshed on the next auth request
- **Service Role Key**: Keep this secret secure - it bypasses ALL RLS policies
- **Tenant Isolation**: JWT-based RLS ensures database-level tenant isolation
- **No Client Manipulation**: Clients cannot modify their own JWT claims

---

## Testing

### Manual Testing

#### 1. Test Tenant Owner Access

```typescript
// Login as tenant owner
const { data } = await supabase.auth.signInWithPassword({
  email: 'owner@tenant1.com',
  password: 'password'
})

// Should see only tenant1 data
const { data: customers } = await supabase
  .from('customers')
  .select('*')

// Should NOT see tenant2 data
```

#### 2. Test Platform Admin Access

```typescript
// Login as platform admin
const { data } = await supabase.auth.signInWithPassword({
  email: 'admin@platform.com',
  password: 'password'
})

// Should see ALL tenants
const { data: tenants } = await supabase
  .from('tenants')
  .select('*')
```

#### 3. Test Cross-Tenant Prevention

```typescript
// Login as tenant1 user
await supabase.auth.signInWithPassword({
  email: 'user@tenant1.com',
  password: 'password'
})

// Try to access tenant2's customer (should fail)
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .eq('id', 'tenant2-customer-id')

// error should be present or data should be empty
```

### Automated Testing

```typescript
// test/auth/jwt-claims.test.ts
import { setTenantUserClaims, getUserJwtClaims } from '@/lib/auth/set-jwt-claims'
import { JWT_ROLES } from '@/lib/auth/jwt-claims'

describe('JWT Claims', () => {
  it('should set tenant user claims', async () => {
    const result = await setTenantUserClaims(
      supabaseAdmin,
      userId,
      JWT_ROLES.TENANT_OWNER,
      tenantId
    )
    
    expect(result.success).toBe(true)
    
    const claims = await getUserJwtClaims(supabaseAdmin, userId)
    expect(claims.role).toBe('tenant_owner')
    expect(claims.tenant_id).toBe(tenantId)
  })

  it('should prevent invalid role assignment', async () => {
    const result = await setUserJwtClaims(supabaseAdmin, userId, {
      role: 'invalid_role' as any
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid role')
  })
})
```

---

## Troubleshooting

### Issue: User can't access their tenant's data

**Check:**
1. JWT claims are set: `SELECT app_metadata FROM auth.users WHERE id = '<user-id>'`
2. RLS policy exists for the table
3. RLS policy checks `auth.jwt() ->> 'tenant_id'`
4. User's tenant_id matches the row's tenant_id

### Issue: Platform admin can't access all tenants

**Check:**
1. JWT has `role: 'platform_admin'` in app_metadata
2. RLS policies check for `(auth.jwt() ->> 'role') = 'platform_admin'`
3. User logged in after app_metadata was set (JWT refresh)

### Issue: RLS policy not working

**Debug:**
```sql
-- Test what JWT claims the current user has
SELECT auth.jwt();

-- Test RLS policy manually
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"role":"tenant_owner","tenant_id":"<uuid>"}';
SELECT * FROM tenant.customers;
```

---

## Summary

1. **JWT claims are set via app_metadata** using the Admin API
2. **Supabase automatically embeds app_metadata in JWTs**
3. **RLS policies access claims via** `auth.jwt() ->> 'claim_name'`
4. **Only server-side code with service_role can set claims**
5. **Always set claims immediately after user creation**
6. **Use helper functions** from `lib/auth/set-jwt-claims.ts`

This ensures secure, database-level authorization and tenant isolation.
