# Impersonation Architecture Plan

## Problem

Current approach patches individual APIs to check impersonation cookie. This is:
- Not scalable (many tenant APIs)
- Error-prone (easy to miss APIs)
- Duplicated logic

## Proposed Solution

### 1. Create Impersonation Utility

**File**: `src/lib/auth/get-effective-tenant.ts`

```typescript
/**
 * Get the effective tenant ID for the current request.
 * Priority:
 * 1. Impersonation cookie (if user is platform_admin)
 * 2. User's actual tenant_id from JWT claims
 */
export async function getEffectiveTenantId(request: NextRequest): Promise<{
  tenantId: string | null
  isImpersonating: boolean
  adminId: string | null // Original admin ID if impersonating
}>
```

---

### 2. Modify Proxy/Middleware

**File**: `src/lib/supabase/proxy.ts`

Add to `updateSession`:
- Check for impersonation cookie
- If platform_admin + impersonation cookie → set `X-Tenant-Id` header
- All downstream APIs read tenant from header

```typescript
// In proxy.ts updateSession()
if (isPlatformAdmin) {
  const impersonateTenantId = request.cookies.get('impersonate_tenant_id')?.value
  if (impersonateTenantId) {
    // Set header for downstream use
    request.headers.set('X-Tenant-Id', impersonateTenantId)
    request.headers.set('X-Impersonating', 'true')
  }
}
```

---

### 3. Create Tenant Context Helper

**File**: `src/lib/auth/tenant-context.ts`

```typescript
/**
 * Get tenant context from request.
 * Used by all tenant APIs to get the correct tenant ID.
 */
export async function getTenantContext(request: NextRequest): Promise<{
  tenantId: string | null
  isImpersonating: boolean
}>
```

Logic:
1. Check `X-Tenant-Id` header (set by middleware for impersonation)
2. Fall back to user's JWT `tenant_id` claim
3. Return null if neither exists

---

### 4. Update Tenant APIs

All tenant APIs (`/api/tenant/*`, `/api/jobs`, etc.) should use:

```typescript
import { getTenantContext } from '@/lib/auth/tenant-context'

export async function GET(request: NextRequest) {
  const { tenantId, isImpersonating } = await getTenantContext(request)
  
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
  }
  
  // Use tenantId for queries...
}
```

---

## Files to Create/Modify

| Priority | File | Action |
|----------|------|--------|
| 1 | `src/lib/auth/tenant-context.ts` | NEW - Centralized tenant context helper |
| 2 | `src/lib/supabase/proxy.ts` | Modify - Set X-Tenant-Id header |
| 3 | `src/app/api/tenant/stats/route.ts` | Refactor to use helper |
| 4 | `src/app/api/jobs/route.ts` | Refactor to use helper |
| 5 | Other tenant APIs | Refactor as needed |

---

## Security Considerations

- Only `platform_admin` role can use impersonation
- Verify admin session before trusting cookie
- Log impersonation actions for audit trail
- Cookie has 1-hour expiry

---

## User Review Required

> [!IMPORTANT]
> Please confirm this approach before I proceed with implementation.
