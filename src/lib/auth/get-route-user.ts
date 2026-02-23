import { NextRequest } from 'next/server'

/**
 * Represents an authenticated user extracted from middleware-injected headers.
 * This avoids a redundant ~200-500ms getUser() call to Supabase Auth in API routes.
 */
export interface RouteUser {
  id: string
  email: string
  role: string | null
  tenantId: string | null
  isPlatformAdmin: boolean
}

/**
 * Header names used to forward auth context from middleware to API routes.
 * These are internal headers set by proxy.ts middleware — never trust from external requests.
 */
export const AUTH_HEADERS = {
  USER_ID: 'x-authenticated-user-id',
  USER_EMAIL: 'x-authenticated-user-email',
  USER_ROLE: 'x-authenticated-user-role',
  TENANT_ID: 'x-authenticated-tenant-id',
} as const

/**
 * Extract authenticated user from middleware-injected request headers.
 * 
 * The middleware (proxy.ts) already calls supabase.auth.getUser() on every request
 * and injects the user context into response headers. This function reads those
 * headers in API route handlers, eliminating a redundant ~200-500ms network call.
 * 
 * @returns RouteUser if authenticated, null if no user context present
 */
export function getRouteUser(request: NextRequest): RouteUser | null {
  const id = request.headers.get(AUTH_HEADERS.USER_ID)
  if (!id) return null

  const role = request.headers.get(AUTH_HEADERS.USER_ROLE) || null

  return {
    id,
    email: request.headers.get(AUTH_HEADERS.USER_EMAIL) || '',
    role,
    tenantId: request.headers.get(AUTH_HEADERS.TENANT_ID) || null,
    isPlatformAdmin: role === 'platform_admin',
  }
}

/**
 * Extract authenticated user from headers, throwing a typed error if not present.
 * Use this in routes that always require authentication.
 */
export function requireRouteUser(request: NextRequest): RouteUser {
  const user = getRouteUser(request)
  if (!user) {
    throw new AuthRequiredError()
  }
  return user
}

export class AuthRequiredError extends Error {
  constructor() {
    super('Authentication required')
    this.name = 'AuthRequiredError'
  }
}
