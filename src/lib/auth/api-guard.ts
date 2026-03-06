/**
 * API Route Guard Utilities
 * 
 * Centralized authentication, authorization, and tenant validation for API routes.
 * 
 * CRITICAL SECURITY RULES:
 * 1. NEVER trust client-supplied tenant IDs (headers, body, query params)
 * 2. ALWAYS extract tenant_id from app_metadata in JWT (server-controlled)
 * 3. ALWAYS validate UUID format before passing to database queries
 * 4. ALWAYS check role-based permissions for write operations
 * 
 * Usage:
 *   const guard = await apiGuard(request, { requiredRoles: TENANT_ADMIN_ROLES })
 *   if (!guard.ok) return guard.response
 *   // guard.user, guard.tenantId, guard.role are now safe to use
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  JWT_ROLES,
  TENANT_ADMIN_ROLES,
  TENANT_MANAGER_ROLES,
  TENANT_ROLES,
} from './jwt-claims'
import {
  checkUserRateLimit,
  createRateLimitResponse,
  type RateLimitConfig,
  RATE_LIMITS,
} from '../rate-limiter'

// ============================================================================
// UUID VALIDATION
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i; //this is UUID v4 specific regex

/**
 * Validate a string is a valid UUID v4 format
 */
export function isValidUUID(value: string | null | undefined): value is string {
  if (!value) return false
  return UUID_REGEX.test(value)
}

/**
 * Validate a route parameter ID and return error response if invalid
 */
export function validateRouteId(id: string | undefined, entityName = 'resource'): NextResponse | null {
  if (!id || !isValidUUID(id)) {
    return NextResponse.json(
      { error: `Invalid ${entityName} ID format` },
      { status: 400 }
    )
  }
  return null
}

// ============================================================================
// GUARD TYPES
// ============================================================================

export interface ApiGuardOptions {
  /**
   * Roles allowed to access this endpoint.
   * If not specified, any authenticated tenant user can access.
   * Use TENANT_ADMIN_ROLES for admin-only operations.
   * Use TENANT_MANAGER_ROLES for admin+manager operations.
   * Use TENANT_ROLES for any tenant member.
   */
  requiredRoles?: readonly string[]

  /**
   * Rate limit configuration.
   * Defaults to RATE_LIMITS.STANDARD for GET, RATE_LIMITS.WRITE for mutations.
   */
  rateLimit?: RateLimitConfig | false

  /**
   * Custom rate limit action key (for per-action limits).
   * E.g., 'create-user', 'delete-customer'
   */
  rateLimitAction?: string
}

export interface ApiGuardSuccess {
  ok: true
  userId: string
  tenantId: string
  role: string
  supabase: SupabaseClient
  response?: never
}

export interface ApiGuardFailure {
  ok: false
  response: NextResponse
  userId?: never
  tenantId?: never
  role?: never
  supabase?: never
}

export type ApiGuardResult = ApiGuardSuccess | ApiGuardFailure

// ============================================================================
// MAIN GUARD FUNCTION
// ============================================================================

/**
 * Unified API route guard. Handles:
 * 1. Authentication (reads pre-authenticated headers from proxy middleware)
 * 2. Tenant ID extraction (from app_metadata ONLY - never user_metadata)
 * 3. UUID format validation on tenant ID
 * 4. Role-based authorization
 * 5. Rate limiting
 * 
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const guard = await apiGuard(request, { requiredRoles: TENANT_ADMIN_ROLES })
 *   if (!guard.ok) return guard.response
 *   
 *   const { userId, tenantId, supabase } = guard
 *   // ... safe to proceed
 * }
 * ```
 */
export async function apiGuard(
  request: NextRequest,
  options: ApiGuardOptions = {}
): Promise<ApiGuardResult> {
  const { requiredRoles, rateLimit, rateLimitAction } = options

  // 1. Read auth context from proxy middleware headers (already authenticated in proxy.ts)
  const userId = request.headers.get('x-user-id')
  const headerTenantId = request.headers.get('x-tenant-id')
  const headerRole = request.headers.get('x-user-role')

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  // Create Supabase client for DB queries (not for auth)
  const supabase = await createClient()

  // 2. Extract tenant_id and role from proxy headers (set from app_metadata in proxy.ts)
  //    SECURITY: These headers are set by proxy.ts from JWT app_metadata, not spoofable by client
  const tenantId = headerTenantId
  const role = headerRole || undefined

  if (!tenantId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Tenant context missing. Please contact support.' },
        { status: 403 }
      ),
    }
  }

  // 3. Validate tenant_id is a valid UUID
  if (!isValidUUID(tenantId)) {
    console.error(`[API Guard] Invalid tenant_id format in JWT: ${tenantId} for user ${userId}`)
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid tenant context' },
        { status: 403 }
      ),
    }
  }

  // 4. Role-based authorization
  if (requiredRoles && requiredRoles.length > 0) {
    if (!role || !requiredRoles.includes(role)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        ),
      }
    }
  }

  // 5. Rate limiting
  if (rateLimit !== false) {
    // Detect HTTP method and use appropriate default
    const method = request.method.toUpperCase()
    const isReadMethod = method === 'GET' || method === 'HEAD'
    const defaultRateLimit = isReadMethod ? RATE_LIMITS.READ : RATE_LIMITS.WRITE

    const config = rateLimit || defaultRateLimit
    const action = rateLimitAction || request.nextUrl.pathname
    const rateLimitResult = checkUserRateLimit(userId, config, action)

    if (!rateLimitResult.success) {
      return {
        ok: false,
        response: createRateLimitResponse(rateLimitResult) as unknown as NextResponse,
      }
    }
  }

  return {
    ok: true,
    userId,
    tenantId,
    role: role || 'unknown',
    supabase,
  }
}

// ============================================================================
// CONVENIENCE GUARDS
// ============================================================================

/**
 * Guard for read-only endpoints (any authenticated tenant user)
 */
export async function apiGuardRead(request: NextRequest): Promise<ApiGuardResult> {
  return apiGuard(request, {
    rateLimit: RATE_LIMITS.READ,
  })
}

/**
 * Guard for write endpoints accessible to admins and managers
 */
export async function apiGuardWrite(request: NextRequest, rateLimitAction?: string): Promise<ApiGuardResult> {
  return apiGuard(request, {
    requiredRoles: TENANT_MANAGER_ROLES,
    rateLimit: RATE_LIMITS.WRITE,
    rateLimitAction,
  })
}

/**
 * Guard for admin-only endpoints (tenant owners and admins only)
 */
export async function apiGuardAdmin(request: NextRequest, rateLimitAction?: string): Promise<ApiGuardResult> {
  return apiGuard(request, {
    requiredRoles: TENANT_ADMIN_ROLES,
    rateLimit: RATE_LIMITS.WRITE,
    rateLimitAction,
  })
}

/**
 * Guard for sensitive operations (tenant owners only)
 */
export async function apiGuardOwner(request: NextRequest, rateLimitAction?: string): Promise<ApiGuardResult> {
  return apiGuard(request, {
    requiredRoles: [JWT_ROLES.TENANT, JWT_ROLES.TENANT_OWNER],
    rateLimit: RATE_LIMITS.WRITE,
    rateLimitAction,
  })
}

// ============================================================================
// RE-EXPORTS for convenience
// ============================================================================

export {
  TENANT_ADMIN_ROLES,
  TENANT_MANAGER_ROLES,
  TENANT_ROLES,
  JWT_ROLES,
  RATE_LIMITS,
}
