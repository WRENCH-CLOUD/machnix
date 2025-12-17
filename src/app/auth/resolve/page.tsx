import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function ResolveAuthPage() {
  // ✅ cookies() IS ASYNC
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const claims = user.app_metadata as {
    role?: string
    tenant_id?: string
  }

  if (claims.role === 'platform_admin') {
    redirect('/admin/dashboard')
  }

  if (claims.role === 'mechanic') {
    redirect('/mechanic/dashboard')
  }

  if (claims.tenant_id) {
    redirect('/tenant/dashboard')
  }

  redirect('/auth/no-access')
}
