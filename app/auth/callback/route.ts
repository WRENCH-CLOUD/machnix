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
      // Get or create tenant for the user
      const { data: tenantData, error: tenantError } = await supabase
        .rpc('get_or_create_user_tenant', { user_id: data.user.id })

      if (!tenantError && tenantData) {
        // Redirect to home with tenant context
        return NextResponse.redirect(new URL('/', requestUrl.origin))
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
