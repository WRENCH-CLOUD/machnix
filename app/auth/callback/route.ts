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
      // Get user's tenant and role
      const { data: userData, error: userError } = await supabase
        .schema('tenant')
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', data.user.id)
        .single()

      if (!userError && userData) {
        // Redirect based on role
        let redirectPath = '/'
        
        if (userData.role === 'admin') {
          redirectPath = '/?view=admin'
        } else if (userData.role === 'mechanic') {
          redirectPath = '/?view=mechanic'
        } else {
          redirectPath = '/?view=frontdesk'
        }
        
        return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
