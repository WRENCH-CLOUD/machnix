// lib/supabase/auth-helpers.ts
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from './admin'

/**
 * Create a Supabase client for server-side operations with cookie-based auth
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

/**
 * Verify that the current user is a platform admin
 * @returns Object with isAuthorized, user data, and error message
 */
export async function verifyPlatformAdmin(): Promise<{
  isAuthorized: boolean
  userId: string | null
  error: string | null
}> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the current session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        isAuthorized: false,
        userId: null,
        error: 'Unauthorized: Please log in to access this resource',
      }
    }

    // Use admin client to check platform_admins table
    const supabaseAdmin = getSupabaseAdmin()
    const { data: platformAdmin, error: adminError } = await supabaseAdmin
      .from('platform_admins')
      .select('id, is_active, role')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !platformAdmin) {
      return {
        isAuthorized: false,
        userId: user.id,
        error: 'Forbidden: You do not have platform admin privileges',
      }
    }

    return {
      isAuthorized: true,
      userId: user.id,
      error: null,
    }
  } catch (error) {
    console.error('[AUTH_HELPERS] Error verifying platform admin:', error)
    return {
      isAuthorized: false,
      userId: null,
      error: 'Internal error during authorization check',
    }
  }
}

/**
 * Verify that the current user is authenticated (any role)
 * @returns Object with isAuthenticated, user data, and error message
 */
export async function verifyAuthenticated(): Promise<{
  isAuthenticated: boolean
  userId: string | null
  error: string | null
}> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the current session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        isAuthenticated: false,
        userId: null,
        error: 'Unauthorized: Please log in to access this resource',
      }
    }

    return {
      isAuthenticated: true,
      userId: user.id,
      error: null,
    }
  } catch (error) {
    console.error('[AUTH_HELPERS] Error verifying authentication:', error)
    return {
      isAuthenticated: false,
      userId: null,
      error: 'Internal error during authentication check',
    }
  }
}
