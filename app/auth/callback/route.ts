import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CookieOptions } from '@supabase/ssr/dist/main/types'
import { createServerClient } from '@supabase/ssr/dist/main/createServerClient'
import { cookies } from 'next/dist/server/request/cookies'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

if (code) {
    const cookieStore = cookies()

    // 🔑 Use createServerClient for secure cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore).get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
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
