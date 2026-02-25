import { NextResponse } from 'next/server'

// ============================================================================
// Auth Context — extracted from middleware-verified request headers
// ============================================================================

export interface AuthContext {
    userId: string
    tenantId: string
    role: string
}

/**
 * Extract pre-verified auth context from request headers.
 * 
 * These headers are set by the middleware (proxy.ts) after calling getUser().
 * Since middleware already verified the user, API routes don't need to call
 * supabase.auth.getUser() again — saving ~200-400ms per request.
 * 
 * @returns AuthContext if headers are present, null otherwise
 */
export function getAuthFromHeaders(request: Request): AuthContext | null {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const role = request.headers.get('x-user-role') || ''

    if (!userId) {
        return null
    }

    return { userId, tenantId: tenantId || '', role }
}

/**
 * Require full auth context (userId + tenantId).
 * Returns the auth context or a JSON error response.
 */
export function requireAuth(request: Request): AuthContext | NextResponse {
    const auth = getAuthFromHeaders(request)

    if (!auth || !auth.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!auth.tenantId) {
        return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    return auth
}

/**
 * Type guard to check if requireAuth returned an error response
 */
export function isAuthError(result: AuthContext | NextResponse): result is NextResponse {
    return result instanceof NextResponse
}
