# JWT Claims Flow Diagram

## Complete Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVER-SIDE (Trusted)                             │
│                   Uses service_role_key (Admin Access)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │  STEP 1: Create Auth User                          │
        │  ─────────────────────────                         │
        │  supabaseAdmin.auth.admin.createUser({             │
        │    email: 'user@tenant1.com',                      │
        │    password: 'password',                           │
        │    user_metadata: { name: 'John' }                 │
        │  })                                                │
        └───────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │  STEP 2: Set JWT Claims via app_metadata          │
        │  ────────────────────────────────────             │
        │  setTenantUserClaims(                              │
        │    supabaseAdmin,                                  │
        │    userId,                                         │
        │    'tenant_owner',                                 │
        │    tenantId                                        │
        │  )                                                 │
        │                                                    │
        │  ↓ Internally calls:                              │
        │                                                    │
        │  supabaseAdmin.auth.admin.updateUserById(userId, { │
        │    app_metadata: {                                 │
        │      role: 'tenant_owner',                         │
        │      tenant_id: '<tenant-uuid>'                    │
        │    }                                               │
        │  })                                                │
        └───────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   SUPABASE AUTH (Automatic)                              │
│                                                                           │
│  auth.users table:                                                       │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ id       │ email             │ app_metadata                     │    │
│  ├──────────┼───────────────────┼──────────────────────────────────┤    │
│  │ uuid-123 │ user@tenant1.com  │ {                                │    │
│  │          │                   │   "role": "tenant_owner",        │    │
│  │          │                   │   "tenant_id": "<tenant-uuid>"   │    │
│  │          │                   │ }                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ▼ Supabase automatically embeds app_metadata into JWT                  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LOGIN                                      │
│                                                                           │
│  supabase.auth.signInWithPassword({                                     │
│    email: 'user@tenant1.com',                                           │
│    password: 'password'                                                 │
│  })                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    JWT RETURNED TO CLIENT                                │
│                                                                           │
│  {                                                                       │
│    "sub": "uuid-123",                    ← User ID                       │
│    "email": "user@tenant1.com",          ← Email                         │
│    "role": "tenant_owner",               ← From app_metadata ✓          │
│    "tenant_id": "<tenant-uuid>",         ← From app_metadata ✓          │
│    "iat": 1234567890,                    ← Issued at                     │
│    "exp": 1234567890                     ← Expires at                    │
│  }                                                                       │
│                                                                           │
│  Client stores JWT and includes it in all requests                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   CLIENT MAKES DATA REQUEST                              │
│                                                                           │
│  supabase.from('customers').select('*')                                 │
│                                                                           │
│  Request includes JWT in Authorization header:                           │
│  Authorization: Bearer <JWT>                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                POSTGRESQL RLS POLICY EVALUATION                          │
│                                                                           │
│  CREATE POLICY customers_select                                          │
│    ON tenant.customers                                                   │
│    FOR SELECT                                                            │
│    USING (                                                               │
│      -- Extract 'role' from JWT                                         │
│      (auth.jwt() ->> 'role') = 'platform_admin'                         │
│      OR                                                                  │
│      -- Extract 'tenant_id' from JWT and compare                        │
│      (auth.jwt() ->> 'tenant_id') = tenant_id::text                     │
│    );                                                                    │
│                                                                           │
│  ▼ PostgreSQL extracts claims from JWT:                                 │
│    - auth.jwt() ->> 'role' returns 'tenant_owner'                       │
│    - auth.jwt() ->> 'tenant_id' returns '<tenant-uuid>'                 │
│                                                                           │
│  ▼ Checks if tenant_id matches:                                         │
│    - Row tenant_id: '<tenant-uuid>'                                     │
│    - JWT tenant_id:  '<tenant-uuid>'                                    │
│    - ✓ MATCH - Row is included in results                               │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA RETURNED TO CLIENT                             │
│                                                                           │
│  Only rows where tenant_id matches JWT tenant_id:                        │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ id   │ name          │ tenant_id      │ email                  │    │
│  ├──────┼───────────────┼────────────────┼────────────────────────┤    │
│  │ 1    │ Customer A    │ <tenant-uuid>  │ customerA@example.com  │    │
│  │ 2    │ Customer B    │ <tenant-uuid>  │ customerB@example.com  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  Rows from other tenants are NEVER returned                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Security Points

### 🔒 Client CANNOT Modify JWT Claims

```
❌ This is IMPOSSIBLE from client code:

supabase.auth.admin.updateUserById(userId, {
  app_metadata: { role: 'platform_admin' }  // ← Requires service_role key
})

Client only has anon_key, which CANNOT modify app_metadata
```

### ✅ Only Server Can Modify JWT Claims

```
✓ This ONLY works from server with service_role key:

supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: { role: 'tenant_owner', tenant_id: tenantId }
})

Server has service_role key, which bypasses all RLS
```

## Role Comparison

### Platform Admin JWT
```json
{
  "role": "platform_admin"
  // No tenant_id - can access ALL tenants
}
```

**RLS Evaluation:**
```sql
-- Can see customers from ALL tenants
(auth.jwt() ->> 'role') = 'platform_admin'  -- ✓ TRUE
```

### Tenant Owner JWT
```json
{
  "role": "tenant_owner",
  "tenant_id": "abc-123"
}
```

**RLS Evaluation:**
```sql
-- Can only see customers where tenant_id matches
(auth.jwt() ->> 'tenant_id') = 'abc-123'::text  -- ✓ TRUE for abc-123
(auth.jwt() ->> 'tenant_id') = 'xyz-789'::text  -- ✗ FALSE for xyz-789
```

## Cross-Tenant Protection

```
User from Tenant A (tenant_id: 'aaa-111') logs in
JWT contains: { role: 'tenant_owner', tenant_id: 'aaa-111' }

Tries to query customers:
┌────┬──────────────┬─────────────┐
│ id │ name         │ tenant_id   │
├────┼──────────────┼─────────────┤
│ 1  │ Customer A1  │ aaa-111     │ ✓ VISIBLE (tenant_id matches JWT)
│ 2  │ Customer A2  │ aaa-111     │ ✓ VISIBLE (tenant_id matches JWT)
│ 3  │ Customer B1  │ bbb-222     │ ✗ HIDDEN  (tenant_id doesn't match)
│ 4  │ Customer B2  │ bbb-222     │ ✗ HIDDEN  (tenant_id doesn't match)
└────┴──────────────┴─────────────┘

RLS automatically filters rows where:
  (auth.jwt() ->> 'tenant_id') ≠ tenant_id

User ONLY sees rows 1 and 2
```

## Why This Is Secure

1. **Server-Only Modification**: Only code with `service_role_key` can set `app_metadata`
2. **Database-Level Enforcement**: RLS runs in PostgreSQL, cannot be bypassed by client
3. **Automatic Embedding**: Supabase automatically embeds `app_metadata` in JWT
4. **Tamper-Proof**: JWT is signed, clients cannot modify claims
5. **Tenant Isolation**: Each tenant's data is isolated at the database level

## Implementation Checklist

- [x] Define JWT claim constants (`lib/auth/jwt-claims.ts`)
- [x] Create helper functions (`lib/auth/set-jwt-claims.ts`)
- [x] Update user creation to set JWT claims
- [x] Create RLS policies using standardized claims
- [ ] Run migration to update RLS policies
- [ ] Update existing users with proper JWT claims
- [ ] Test tenant isolation
- [ ] Test platform admin access
- [ ] Test role-based permissions
