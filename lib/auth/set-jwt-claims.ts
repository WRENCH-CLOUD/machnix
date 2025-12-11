/**
 * JWT Claims Management via app_metadata
 * 
 * This module provides functions to set JWT claims on Supabase Auth users.
 * 
 * HOW IT WORKS:
 * =============
 * 1. Supabase Auth users have an `app_metadata` field that can only be modified
 *    by the Admin API (using service_role key)
 * 2. Values in `app_metadata` are automatically embedded into the user's JWT
 * 3. These JWT claims are then accessible in RLS policies via auth.jwt()
 * 4. The JWT is automatically refreshed when app_metadata changes
 * 
 * SECURITY:
 * =========
 * - Only server-side code with service_role key can modify app_metadata
 * - Clients CANNOT arbitrarily set their own JWT claims
 * - This ensures role and tenant_id claims are trusted and secure
 * 
 * USAGE:
 * ======
 * import { setUserJwtClaims } from '@/lib/auth/set-jwt-claims'
 * 
 * await setUserJwtClaims(supabaseAdmin, userId, {
 *   role: 'tenant_owner',
 *   tenant_id: tenantId
 * })
 */

import { SupabaseClient } from '@supabase/supabase-js'
import {
  JWT_CLAIM_ROLE,
  JWT_CLAIM_TENANT_ID,
  JwtAppMetadata,
  JwtRole,
  JWT_ROLES,
  isValidRole,
  isTenantRole,
} from './jwt-claims'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SetJwtClaimsParams {
  /**
   * The user's role (must be a valid JwtRole)
   */
  role: JwtRole
  
  /**
   * The tenant ID (required for tenant-scoped roles)
   */
  tenant_id?: string
}

interface SetJwtClaimsResult {
  success: boolean
  error?: string
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Set JWT claims on a user by updating their app_metadata
 * 
 * This function MUST be called from server-side code using the Admin client
 * (with service_role key). It will:
 * 1. Validate the role and tenant_id
 * 2. Update the user's app_metadata
 * 3. The JWT will be automatically refreshed on next request
 * 
 * @param supabaseAdmin - Supabase admin client (with service_role key)
 * @param userId - The auth user ID (from auth.users)
 * @param claims - The JWT claims to set (role and optionally tenant_id)
 * @returns Result indicating success or error
 * 
 * @example
 * // Set tenant owner claims
 * await setUserJwtClaims(supabaseAdmin, userId, {
 *   role: JWT_ROLES.TENANT_OWNER,
 *   tenant_id: tenantId
 * })
 * 
 * @example
 * // Set platform admin claims (no tenant_id needed)
 * await setUserJwtClaims(supabaseAdmin, userId, {
 *   role: JWT_ROLES.PLATFORM_ADMIN
 * })
 */
export async function setUserJwtClaims(
  supabaseAdmin: SupabaseClient,
  userId: string,
  claims: SetJwtClaimsParams
): Promise<SetJwtClaimsResult> {
  // Validate inputs
  const validation = validateJwtClaims(claims)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    }
  }

  try {
    // Build app_metadata object
    const appMetadata: JwtAppMetadata = {
      [JWT_CLAIM_ROLE]: claims.role,
    }

    // Add tenant_id only if provided (tenant-scoped roles)
    if (claims.tenant_id) {
      appMetadata[JWT_CLAIM_TENANT_ID] = claims.tenant_id
    }

    // Update user via Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        app_metadata: appMetadata,
      }
    )

    if (error) {
      console.error('[SET_JWT_CLAIMS] Failed to update user:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    console.log(`[SET_JWT_CLAIMS] Successfully set claims for user ${userId}:`, appMetadata)

    return {
      success: true,
    }
  } catch (error) {
    console.error('[SET_JWT_CLAIMS] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Set JWT claims for a tenant user (convenience wrapper)
 * 
 * This is a helper function specifically for tenant-scoped users.
 * It ensures tenant_id is always provided.
 * 
 * @param supabaseAdmin - Supabase admin client
 * @param userId - The auth user ID
 * @param role - The tenant role
 * @param tenantId - The tenant ID (required)
 * @returns Result indicating success or error
 * 
 * @example
 * await setTenantUserClaims(
 *   supabaseAdmin,
 *   userId,
 *   JWT_ROLES.TENANT_OWNER,
 *   tenantId
 * )
 */
export async function setTenantUserClaims(
  supabaseAdmin: SupabaseClient,
  userId: string,
  role: JwtRole,
  tenantId: string
): Promise<SetJwtClaimsResult> {
  if (!tenantId) {
    return {
      success: false,
      error: 'tenant_id is required for tenant user claims',
    }
  }

  return setUserJwtClaims(supabaseAdmin, userId, {
    role,
    tenant_id: tenantId,
  })
}

/**
 * Set JWT claims for a platform admin (convenience wrapper)
 * 
 * This is a helper function specifically for platform admins.
 * Platform admins do not have a tenant_id.
 * 
 * @param supabaseAdmin - Supabase admin client
 * @param userId - The auth user ID
 * @returns Result indicating success or error
 * 
 * @example
 * await setPlatformAdminClaims(supabaseAdmin, userId)
 */
export async function setPlatformAdminClaims(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<SetJwtClaimsResult> {
  return setUserJwtClaims(supabaseAdmin, userId, {
    role: JWT_ROLES.PLATFORM_ADMIN,
  })
}

/**
 * Update only the role (keeps existing tenant_id if present)
 * 
 * Use this when changing a user's role within the same tenant.
 * 
 * @param supabaseAdmin - Supabase admin client
 * @param userId - The auth user ID
 * @param newRole - The new role to assign
 * @returns Result indicating success or error
 * 
 * @example
 * // Promote mechanic to manager within same tenant
 * await updateUserRole(supabaseAdmin, userId, JWT_ROLES.MANAGER)
 */
export async function updateUserRole(
  supabaseAdmin: SupabaseClient,
  userId: string,
  newRole: JwtRole
): Promise<SetJwtClaimsResult> {
  try {
    // First, get the current user to preserve tenant_id if present
    const { data: user, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (getUserError || !user) {
      return {
        success: false,
        error: 'Failed to retrieve user',
      }
    }

    // Get existing app_metadata
    const existingMetadata = (user.user.app_metadata || {}) as JwtAppMetadata
    const existingTenantId = existingMetadata[JWT_CLAIM_TENANT_ID]

    // Set new claims, preserving tenant_id if it exists
    return setUserJwtClaims(supabaseAdmin, userId, {
      role: newRole,
      tenant_id: existingTenantId,
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate JWT claims before setting them
 */
function validateJwtClaims(claims: SetJwtClaimsParams): ValidationResult {
  // Validate role
  if (!claims.role) {
    return {
      valid: false,
      error: 'Role is required',
    }
  }

  if (!isValidRole(claims.role)) {
    return {
      valid: false,
      error: `Invalid role: ${claims.role}. Must be one of: ${Object.values(JWT_ROLES).join(', ')}`,
    }
  }

  // Validate tenant_id for tenant-scoped roles
  if (isTenantRole(claims.role)) {
    if (!claims.tenant_id) {
      return {
        valid: false,
        error: `tenant_id is required for role: ${claims.role}`,
      }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(claims.tenant_id)) {
      return {
        valid: false,
        error: 'tenant_id must be a valid UUID',
      }
    }
  }

  // Warn if tenant_id provided for non-tenant role
  if (!isTenantRole(claims.role) && claims.tenant_id) {
    console.warn(
      `[VALIDATE_JWT_CLAIMS] tenant_id provided for non-tenant role: ${claims.role}. It will be ignored.`
    )
  }

  return {
    valid: true,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current JWT claims from a user
 * 
 * @param supabaseAdmin - Supabase admin client
 * @param userId - The auth user ID
 * @returns The current JWT claims or null if not found
 * 
 * @example
 * const claims = await getUserJwtClaims(supabaseAdmin, userId)
 * console.log(claims.role, claims.tenant_id)
 */
export async function getUserJwtClaims(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<JwtAppMetadata | null> {
  try {
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (error || !user) {
      console.error('[GET_JWT_CLAIMS] Failed to retrieve user:', error)
      return null
    }

    return (user.user.app_metadata || {}) as JwtAppMetadata
  } catch (error) {
    console.error('[GET_JWT_CLAIMS] Unexpected error:', error)
    return null
  }
}

/**
 * Remove JWT claims from a user (clear app_metadata)
 * 
 * Use this when deactivating a user or removing their access.
 * 
 * @param supabaseAdmin - Supabase admin client
 * @param userId - The auth user ID
 * @returns Result indicating success or error
 * 
 * @example
 * await clearUserJwtClaims(supabaseAdmin, userId)
 */
export async function clearUserJwtClaims(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<SetJwtClaimsResult> {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: {},
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    console.log(`[CLEAR_JWT_CLAIMS] Successfully cleared claims for user ${userId}`)

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
