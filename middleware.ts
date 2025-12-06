import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl
  const hostname = req.headers.get('host') || ''

  // Skip middleware for public routes and static files
  const publicPaths = ['/auth', '/api', '/_next', '/favicon.ico', '/test-connection']
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return response
  }

  // Extract subdomain from hostname
  // Format: subdomain.domain.com or localhost:3000 for local dev
  const subdomain = extractSubdomain(hostname)


  // For local development without subdomain
  if (!subdomain || subdomain === 'localhost' || subdomain === '127.0.0.1') {
    // Check if user has a tenant in localStorage (client-side handling)
    // For local dev, we rely on the auth provider to handle tenant context
    return response
  }

  // Validate subdomain and get tenant
  try {
    const { data: tenant, error } = await supabase
      .schema('tenant')
      .from('tenants')
      .select('id, name, slug')
      .eq('slug', subdomain)
      .single()

    if (error || !tenant) {
      console.error('[MIDDLEWARE] Invalid subdomain:', subdomain, error)
      
      // Redirect to main domain or show error
      const url = req.nextUrl.clone()
      url.pathname = '/auth/invalid-subdomain'
      return NextResponse.redirect(url)
    }

    // Set tenant context in cookie for the application
    const response = NextResponse.next()
    response.cookies.set('tenant-id', tenant.id, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    response.cookies.set('tenant-slug', tenant.slug, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })



    return response
  } catch (error) {
    console.error('[MIDDLEWARE] Error validating subdomain:', error)
    return response
  }
}

/**
 * Extract subdomain from hostname
 * Examples:
 *   - garage1.machnix.com -> garage1
 *   - localhost:3000 -> localhost
 *   - 127.0.0.1:3000 -> 127.0.0.1
 */
function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0]
  
  // Handle localhost and IP addresses
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return host
  }

  // Split by dots
  const parts = host.split('.')
  
  // Need at least 2 parts for a valid domain (subdomain.domain)
  if (parts.length < 2) {
    return null
  }

  // If we have 3+ parts, the first is the subdomain
  // e.g., garage1.machnix.com -> garage1
  // e.g., api.garage1.machnix.com -> api (we might want to handle this differently)
  if (parts.length >= 3) {
    return parts[0]
  }

  // If only 2 parts (domain.com), no subdomain
  return null
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
