import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = body.userId

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Create server-side Supabase client with service_role (bypasses RLS)
    const cookieStore = await cookies()
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key - bypasses RLS
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    // Step 1: Check if user is a platform admin
    const { data: platformAdmin, error: adminError } = await supabase
      .schema('public')
      .from('platform_admins')
      .select('id, role, is_active')
      .eq('auth_user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (!adminError && platformAdmin) {
      return NextResponse.json({
        role: 'platform_admin',
        tenantId: null,
        type: 'platform_admin',
      })
    }

    // Step 2: Check if user exists in tenant.users
    const { data: tenantUser, error: userError } = await supabase
      .schema('tenant')
      .from('users')
      .select('tenant_id, role, is_active')
      .eq('auth_user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (!userError && tenantUser) {
      return NextResponse.json({
        role: tenantUser.role,
        tenantId: tenantUser.tenant_id,
        type: 'tenant_user',
      })
    }

    // No access
    return NextResponse.json({
      role: 'no_access',
      tenantId: null,
      type: 'no_access',
    })
  } catch (error) {
    console.error('[AUTH_CHECK_ROLE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
