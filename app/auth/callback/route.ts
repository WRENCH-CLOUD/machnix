import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Step 1: Check if user is a platform admin
      const { data: platformAdmin, error: platformAdminError } = await supabase
        .from('platform_admins')
        .select('id, is_active')
        .eq('auth_user_id', data.user.id)
        .eq('is_active', true)
        .single()

      if (!platformAdminError && platformAdmin) {
        // Redirect to home page (which will show AdminDashboard for platform admins)
        return NextResponse.redirect(new URL('/', requestUrl.origin))
      }

      // Step 2: Check if user exists in tenant.users
      const { data: userData, error: userError } = await supabase
        .schema('tenant')
        .from('users')
        .select('tenant_id, role, tenants:tenant_id(slug)')
        .eq('auth_user_id', data.user.id)
        .eq('is_active', true)
        .single()

      if (!userError && userData) {
        const tenant = Array.isArray(userData.tenants) ? userData.tenants[0] : userData.tenants
        const tenantSlug = tenant?.slug || 'default'
        
        // Redirect based on role - all tenant users go to home page
        // The page.tsx will handle routing to appropriate dashboard
        return NextResponse.redirect(new URL('/', requestUrl.origin))
      }

      // Step 3: No access found
      return NextResponse.redirect(new URL('/auth/no-access', requestUrl.origin))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
