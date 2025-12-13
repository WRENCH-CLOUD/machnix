/**
 * JWT Claims Configuration
 * 
 * This file defines the standardized JWT claim names and role values used throughout
 * the application for authentication and authorization via Row Level Security (RLS).
 * 
 * IMPORTANT: These claim names MUST match the keys used in:
 * 1. Supabase Auth app_metadata
 * 2. RLS policies (auth.jwt() ->>> 'claim_name')
 * 3. Client-side user context
 */

// ============================================================================
// JWT CLAIM KEYS
// ============================================================================

/**
 * The JWT claim key for user role
 * Used in RLS: (auth.jwt() ->> 'role')
 */
export const JWT_CLAIM_ROLE = 'role' as const

/**
 * The JWT claim key for tenant ID
 * Used in RLS: (auth.jwt() ->> 'tenant_id')
 */
export const JWT_CLAIM_TENANT_ID = 'tenant_id' as const

// ============================================================================
// ROLE VALUES
// ============================================================================

/**
 * Standardized role values that appear in JWT claims
 * These MUST match the role strings checked in RLS policies
 */
export const JWT_ROLES = {
  /**
   * Service role - Bypasses all RLS, has unlimited access
   * Used by: Backend services using service_role_key
   * RLS Check: (auth.jwt() ->> 'role') = 'service_role'
   */
  SERVICE_ROLE: 'service_role',
  
  /**
   * Platform admin - Global admin across all tenants
   * Used by: Super admins who manage the platform
   * RLS Check: (auth.jwt() ->> 'role') = 'platform_admin'
   * Database: public.platform_admins table
   */
  PLATFORM_ADMIN: 'platform_admin',
  
  /**
   * Tenant owner - Owner of a specific tenant
   * Used by: Primary owner of a tenant organization
   * RLS Check: (auth.jwt() ->> 'role') = 'tenant_owner'
   * Scope: Single tenant via tenant_id claim
   */
  TENANT_OWNER: 'tenant_owner',
  
  /**
   * Tenant admin - Administrator within a tenant
   * Used by: Admins who can manage tenant settings and users
   * RLS Check: (auth.jwt() ->> 'role') = 'tenant_admin'
   * Scope: Single tenant via tenant_id claim
   */
  TENANT_ADMIN: 'tenant_admin',
  
  /**
   * Manager - Manager role within a tenant
   * Used by: Users who can manage jobs, customers, and reports
   * RLS Check: (auth.jwt() ->> 'role') = 'manager'
   * Scope: Single tenant via tenant_id claim
   */
  MANAGER: 'manager',
  
  /**
   * Mechanic - Technical staff who work on vehicles
   * Used by: Mechanics who complete jobs
   * RLS Check: (auth.jwt() ->> 'role') = 'mechanic'
   * Scope: Single tenant via tenant_id claim
   */
  MECHANIC: 'mechanic',
  
  /**
   * Front desk - Reception/customer service staff
   * Used by: Staff who create jobs and interact with customers
   * RLS Check: (auth.jwt() ->> 'role') = 'frontdesk'
   * Scope: Single tenant via tenant_id claim
   */
  FRONTDESK: 'frontdesk',
  
  /**
   * Employee - General employee with limited access
   * Used by: Basic employees with read-only or limited permissions
   * RLS Check: (auth.jwt() ->> 'role') = 'employee'
   * Scope: Single tenant via tenant_id claim
   */
  EMPLOYEE: 'employee',
} as const

/**
 * Type for valid JWT role values
 */
export type JwtRole = typeof JWT_ROLES[keyof typeof JWT_ROLES]

// ============================================================================
// ROLE GROUPS FOR RLS POLICIES
// ============================================================================

/**
 * Roles that have global/privileged access (bypass tenant isolation)
 */
export const PRIVILEGED_ROLES: JwtRole[] = [
  JWT_ROLES.SERVICE_ROLE,
  JWT_ROLES.PLATFORM_ADMIN,
]

/**
 * Roles that have full administrative access within their tenant
 */
export const TENANT_ADMIN_ROLES: JwtRole[] = [
  JWT_ROLES.TENANT_OWNER,
  JWT_ROLES.TENANT_ADMIN,
]

/**
 * Roles that can manage resources (jobs, customers, etc.) within tenant
 */
export const TENANT_MANAGER_ROLES: JwtRole[] = [
  JWT_ROLES.TENANT_OWNER,
  JWT_ROLES.TENANT_ADMIN,
  JWT_ROLES.MANAGER,
]

/**
 * All roles that belong to a tenant (have tenant_id claim)
 */
export const TENANT_ROLES: JwtRole[] = [
  JWT_ROLES.TENANT_OWNER,
  JWT_ROLES.TENANT_ADMIN,
  JWT_ROLES.MANAGER,
  JWT_ROLES.MECHANIC,
  JWT_ROLES.FRONTDESK,
  JWT_ROLES.EMPLOYEE,
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a role is a privileged global role
 */
export function isPrivilegedRole(role: string): boolean {
  return PRIVILEGED_ROLES.includes(role as JwtRole)
}

/**
 * Check if a role is a tenant admin role
 */
export function isTenantAdminRole(role: string): boolean {
  return TENANT_ADMIN_ROLES.includes(role as JwtRole)
}

/**
 * Check if a role belongs to a tenant (requires tenant_id)
 */
export function isTenantRole(role: string): boolean {
  return TENANT_ROLES.includes(role as JwtRole)
}

/**
 * Validate that a role is a valid JWT role
 */
export function isValidRole(role: string): role is JwtRole {
  return Object.values(JWT_ROLES).includes(role as JwtRole)
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Structure of app_metadata that gets embedded in JWT
 */
export interface JwtAppMetadata {
  /**
   * User's role (e.g., 'tenant_owner', 'platform_admin')
   */
  [JWT_CLAIM_ROLE]: JwtRole
  
  /**
   * Tenant ID (UUID string) - only present for tenant-scoped roles
   */
  [JWT_CLAIM_TENANT_ID]?: string
}

/**
 * Additional user metadata (not in JWT, but stored in auth.users)
 */
export interface UserMetadata {
  name?: string
  phone?: string
  avatar_url?: string
  tenant_name?: string
}
