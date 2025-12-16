import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          response.cookies.set({ name, value, ...options })
        },
        remove: (name: string, options: CookieOptions) => {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if needed
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // ---------------------------------------------------------------------------
  // PUBLIC / SYSTEM ROUTES
  // ---------------------------------------------------------------------------
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/auth/callback')
  ) {
    return response
  }

  const publicRoutes = ['/', '/login', '/auth/no-access', '/auth/invalid-subdomain']
  const isPublicRoute = publicRoutes.includes(pathname)

  // ---------------------------------------------------------------------------
  // AUTH CHECK
  // ---------------------------------------------------------------------------
  if (!session && !isPublicRoute) {
    return redirect(req, '/login')
  }

  if (!session) {
    return response
  }

  // ---------------------------------------------------------------------------
  // ROLE & TENANT CLAIMS
  // ---------------------------------------------------------------------------
  const claims = session.user.app_metadata as {
    role?: string
    tenant_id?: string
  }

  const role = claims?.role
  const tenantId = claims?.tenant_id

  // ---------------------------------------------------------------------------
  // ROLE-BASED ROUTE GUARDS
  // ---------------------------------------------------------------------------
  if (pathname.startsWith('/admin') && role !== 'platform_admin') {
    return redirect(req, '/auth/no-access')
  }

  if (pathname.startsWith('/mechanic') && role !== 'mechanic') {
    return redirect(req, '/auth/no-access')
  }

  const tenantRoles = [
    'tenant_owner',
    'tenant_admin',
    'manager',
    'frontdesk',
    'employee',
  ]

  const isTenantRoute =
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/mechanic') &&
    !isPublicRoute

  if (isTenantRoute) {
    if (!tenantRoles.includes(role ?? '') || !tenantId) {
      return redirect(req, '/auth/no-access')
    }

    // Inject tenant context
    response.headers.set('x-tenant-id', tenantId)
    response.cookies.set('tenant-id', tenantId, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  return response
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function redirect(req: NextRequest, path: string) {
  const url = req.nextUrl.clone()
  url.pathname = path
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
