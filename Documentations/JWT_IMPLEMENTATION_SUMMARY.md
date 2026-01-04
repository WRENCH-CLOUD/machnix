# JWT Claims Implementation Summary

## Files Created

### 1. **lib/auth/jwt-claims.ts**
- Defines standardized JWT claim keys (`role`, `tenant_id`)
- Defines all role values (constants)
- Provides role validation helpers
- TypeScript interfaces for type safety

### 2. **lib/auth/set-jwt-claims.ts**
- `setUserJwtClaims()` - Set JWT claims via app_metadata
- `setTenantUserClaims()` - Helper for tenant users
- `setPlatformAdminClaims()` - Helper for platform admins
- `updateUserRole()` - Update role while preserving tenant_id
- `getUserJwtClaims()` - Retrieve current claims
- `clearUserJwtClaims()` - Remove all claims

### 3. **supabase/migrations/20251211000000_standardize_jwt_claims.sql**
- Standardizes all RLS policies with consistent JWT claim checks
- Implements policies for: tenants, users, customers, vehicles, jobcards, estimates, invoices
- Uses `(auth.jwt() ->> 'role')` and `(auth.jwt() ->> 'tenant_id')`

### 4. **Documentations/JWT_CLAIMS_GUIDE.md**
- Complete guide explaining how JWT claims work
- Step-by-step implementation examples
- Security best practices
- Troubleshooting guide

## Files Updated

### 1. **app/api/admin/tenants/create/route.ts**
- Added imports for JWT claim helpers
- Sets JWT claims after user creation using `setTenantUserClaims()`
- Implements proper rollback if claim setting fails

### 2. **scripts/create-platform-admin.ts**
- Added import for `setPlatformAdminClaims()`
- Sets platform_admin role in JWT after user creation
- Handles both new users and existing users

## How It Works (Quick Reference)

### Setting JWT Claims

```typescript
import { setTenantUserClaims } from '@/lib/auth/set-jwt-claims'
import { JWT_ROLES } from '@/lib/auth/jwt-claims'

// After creating a user
await setTenantUserClaims(
  supabaseAdmin,
  userId,
  JWT_ROLES.TENANT_OWNER,
  tenantId
)
```

This internally calls:
```typescript
await supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: {
    role: 'tenant_owner',
    tenant_id: '<tenant-uuid>'
  }
})
```

### RLS Policy Pattern

```sql
CREATE POLICY customers_select
  ON tenant.customers
  FOR SELECT
  USING (
    -- Global admins can see all
    (auth.jwt() ->> 'role') IN ('service_role', 'platform_admin')
    OR
    -- Tenant users can see their tenant's data
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
  );
```

## Standardized Roles

### Global Roles (No tenant_id)
- `service_role` - Unlimited access, bypasses RLS
- `platform_admin` - Cross-tenant admin access

### Tenant Roles (Require tenant_id)
- `tenant_owner` - Full admin within tenant
- `tenant_admin` - Full admin within tenant
- `manager` - Manage resources within tenant
- `mechanic` - Work on jobs
- `frontdesk` - Create jobs, customer interaction
- `employee` - Limited access

## Next Steps

1. **Run the migration**:
   ```bash
   npx supabase migration up
   ```

2. **Update existing users** to have proper JWT claims:
   ```typescript
   // For each existing user, set their claims
   await setTenantUserClaims(supabaseAdmin, userId, role, tenantId)
   ```

3. **Test RLS policies**:
   - Login as different roles
   - Verify tenant isolation
   - Verify platform admin access

4. **Update remaining tables**:
   - Apply the same RLS policy pattern to payments, notifications, activities, etc.

## Key Benefits

✅ **Database-level security** - RLS enforces authorization at the database
✅ **Tenant isolation** - Users can only access their tenant's data
✅ **Type-safe** - TypeScript interfaces prevent role typos
✅ **Centralized** - Single source of truth for roles
✅ **Secure** - Only service_role can set JWT claims
✅ **Standardized** - Consistent patterns across all tables

## Security Notes

- JWT claims can ONLY be set by server-side code with service_role key
- Clients CANNOT arbitrarily inject JWT claims
- app_metadata is automatically embedded in JWTs by Supabase
- RLS policies access claims via `auth.jwt() ->> 'claim_name'`
- JWT is automatically refreshed when app_metadata changes
