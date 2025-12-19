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
  role: JwtRole
  tenant_id?: string
}

interface SetJwtClaimsResult {
  success: boolean
  error?: string
}

interface ValidationResult {
  valid: boolean
  error?: string
}

// ============================================================================
// SERVICE
// ============================================================================

export class JwtClaimsService {
  // --------------------------------------------------------------------------
  // MAIN API
  // --------------------------------------------------------------------------

  async setUserJwtClaims(
    supabaseAdmin: SupabaseClient,
    userId: string,
    claims: SetJwtClaimsParams
  ): Promise<SetJwtClaimsResult> {
    const validation = validateJwtClaims(claims)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const appMetadata: JwtAppMetadata = {
      [JWT_CLAIM_ROLE]: claims.role,
      user_type: isTenantRole(claims.role) ? 'tenant' : 'platform',
    }

    if (claims.tenant_id) {
      appMetadata[JWT_CLAIM_TENANT_ID] = claims.tenant_id
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: appMetadata,
    })

    if (error) {
      console.error('[SET_JWT_CLAIMS]', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  // --------------------------------------------------------------------------
  // CONVENIENCE WRAPPERS
  // --------------------------------------------------------------------------

  async setTenantUserClaims(
    supabaseAdmin: SupabaseClient,
    userId: string,
    role: JwtRole,
    tenantId: string
  ): Promise<SetJwtClaimsResult> {
    if (!tenantId) {
      return { success: false, error: 'tenant_id is required' }
    }

    return this.setUserJwtClaims(supabaseAdmin, userId, {
      role,
      tenant_id: tenantId,
    })
  }

  async setPlatformAdminClaims(
    supabaseAdmin: SupabaseClient,
    userId: string
  ): Promise<SetJwtClaimsResult> {
    return this.setUserJwtClaims(supabaseAdmin, userId, {
      role: JWT_ROLES.PLATFORM_ADMIN,
    })
  }

  async updateUserRole(
    supabaseAdmin: SupabaseClient,
    userId: string,
    newRole: JwtRole
  ): Promise<SetJwtClaimsResult> {
    const { data, error } =
      await supabaseAdmin.auth.admin.getUserById(userId)

    if (error || !data?.user) {
      return { success: false, error: 'Failed to retrieve user' }
    }

    const existingMetadata =
      (data.user.app_metadata ?? {}) as JwtAppMetadata

    const existingRole = existingMetadata[JWT_CLAIM_ROLE]
    const existingTenantId = existingMetadata[JWT_CLAIM_TENANT_ID]

    if (!isTenantRole(existingRole) && isTenantRole(newRole)) {
      return {
        success: false,
        error: 'Cannot convert platform user to tenant role',
      }
    }

    return this.setUserJwtClaims(supabaseAdmin, userId, {
      role: newRole,
      tenant_id: existingTenantId,
    })
  }

  // --------------------------------------------------------------------------
  // READ / CLEAR
  // --------------------------------------------------------------------------

  async getUserJwtClaims(
    supabaseAdmin: SupabaseClient,
    userId: string
  ): Promise<JwtAppMetadata | null> {
    const { data, error } =
      await supabaseAdmin.auth.admin.getUserById(userId)

    if (error || !data?.user) {
      console.error('[GET_JWT_CLAIMS]', error)
      return null
    }

    return (data.user.app_metadata ?? {}) as JwtAppMetadata
  }

  async clearUserJwtClaims(
    supabaseAdmin: SupabaseClient,
    userId: string
  ): Promise<SetJwtClaimsResult> {
    const { data, error } =
      await supabaseAdmin.auth.admin.getUserById(userId)

    if (error || !data?.user) {
      return { success: false, error: 'Failed to retrieve user' }
    }

    const cleaned = { ...(data.user.app_metadata ?? {}) }
    delete cleaned[JWT_CLAIM_ROLE]
    delete cleaned[JWT_CLAIM_TENANT_ID]
    delete cleaned.user_type

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: cleaned,
      })

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateJwtClaims(
  claims: SetJwtClaimsParams
): ValidationResult {
  if (!claims.role) {
    return { valid: false, error: 'Role is required' }
  }

  if (!isValidRole(claims.role)) {
    return {
      valid: false,
      error: `Invalid role: ${claims.role}`,
    }
  }

  if (isTenantRole(claims.role)) {
    if (!claims.tenant_id) {
      return {
        valid: false,
        error: `tenant_id is required for role ${claims.role}`,
      }
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!uuidRegex.test(claims.tenant_id)) {
      return {
        valid: false,
        error: 'tenant_id must be a valid UUID',
      }
    }
  }

  return { valid: true }
}
