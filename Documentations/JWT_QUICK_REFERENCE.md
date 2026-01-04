# JWT Claims Quick Reference

## 🎯 TL;DR

**JWT claims** are set via `app_metadata` on Supabase Auth users. Supabase automatically embeds them in JWTs, and RLS policies use them for authorization.

## 📦 Import

```typescript
import { setTenantUserClaims, setPlatformAdminClaims } from '@/lib/auth/set-jwt-claims'
import { JWT_ROLES } from '@/lib/auth/jwt-claims'
```

## 🚀 Usage

### Creating a Tenant Owner

```typescript
// 1. Create auth user
const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
  email: 'owner@tenant.com',
  password: 'password',
  email_confirm: true
})

// 2. Set JWT claims (CRITICAL!)
await setTenantUserClaims(
  supabaseAdmin,
  authUser.user.id,
  JWT_ROLES.TENANT_OWNER,
  tenantId
)
```

### Creating a Platform Admin

```typescript
// 1. Create auth user
const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
  email: 'admin@platform.com',
  password: 'password',
  email_confirm: true
})

// 2. Set JWT claims
await setPlatformAdminClaims(supabaseAdmin, authUser.user.id)
```

### Creating a Mechanic

```typescript
// 1. Create auth user
const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
  email: 'mechanic@tenant.com',
  password: 'password',
  email_confirm: true
})

// 2. Set JWT claims
await setTenantUserClaims(
  supabaseAdmin,
  authUser.user.id,
  JWT_ROLES.MECHANIC,
  tenantId
)
```

## 🔑 Available Roles

```typescript
JWT_ROLES.SERVICE_ROLE      // Unlimited access (bypasses RLS)
JWT_ROLES.PLATFORM_ADMIN    // Cross-tenant admin
JWT_ROLES.TENANT_OWNER      // Full access within tenant
JWT_ROLES.TENANT_ADMIN      // Full access within tenant
JWT_ROLES.MANAGER           // Manage resources
JWT_ROLES.MECHANIC          // Work on jobs
JWT_ROLES.FRONTDESK         // Create jobs
JWT_ROLES.EMPLOYEE          // Limited access
```

## 📋 RLS Policy Pattern

```sql
CREATE POLICY table_name_select
  ON tenant.table_name
  FOR SELECT
  USING (
    -- Global admins can see all
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    -- Tenant users can see their tenant's data
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );
```

## 🛠️ Helper Functions

| Function | Purpose |
|----------|---------|
| `setUserJwtClaims()` | Set claims (generic) |
| `setTenantUserClaims()` | Set claims for tenant user |
| `setPlatformAdminClaims()` | Set claims for platform admin |
| `updateUserRole()` | Change role, keep tenant_id |
| `getUserJwtClaims()` | Get current claims |
| `clearUserJwtClaims()` | Remove all claims |

## 🔒 Security Rules

1. ✅ **ONLY server-side code** with `service_role` key can set JWT claims
2. ✅ **Set claims immediately** after user creation
3. ✅ **Use helper functions** - they validate inputs
4. ❌ **Never expose** `service_role` key to clients
5. ❌ **Never let clients** set their own claims

## 🧪 Testing Checklist

- [ ] Login as tenant owner → can access only their tenant's data
- [ ] Login as platform admin → can access all tenants
- [ ] Login as mechanic → can access only their tenant's data
- [ ] Verify cross-tenant access is blocked
- [ ] Check JWT contains correct `role` and `tenant_id`

## 📁 Files

| File | Purpose |
|------|---------|
| `lib/auth/jwt-claims.ts` | Constants and types |
| `lib/auth/set-jwt-claims.ts` | Helper functions |
| `supabase/migrations/20251211000000_standardize_jwt_claims.sql` | RLS policies |
| `Documentations/JWT_CLAIMS_GUIDE.md` | Full guide |

## 🚨 Common Mistakes

### ❌ Wrong: Skipping JWT claims

```typescript
const { data: user } = await supabaseAdmin.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password'
})
// User has no JWT claims! RLS will block them.
```

### ✅ Correct: Set claims immediately

```typescript
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

### ❌ Wrong: Setting claims in user_metadata

```typescript
await supabaseAdmin.auth.admin.createUser({
  email: 'user@example.com',
  user_metadata: {
    role: 'tenant_owner',  // ❌ Won't work! Not in JWT
    tenant_id: tenantId
  }
})
```

### ✅ Correct: Use app_metadata via helper

```typescript
await setTenantUserClaims(
  supabaseAdmin,
  userId,
  JWT_ROLES.TENANT_OWNER,  // ✅ Goes in app_metadata → JWT
  tenantId
)
```

## 📞 Need Help?

Read the full guide: `Documentations/JWT_CLAIMS_GUIDE.md`
