import { NextRequest, NextResponse } from 'next/server'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'
import { GetTenantWithStatsUseCase } from '@/modules/tenant/application/get-tenant-with-stats.usecase'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { role } = auth
    let { tenantId } = auth

    const isPlatformAdmin = role === 'platform_admin'

    if (!tenantId && isPlatformAdmin) {
      // Check for impersonation cookie
      const cookieStore = await cookies()
      tenantId = cookieStore.get('impersonate_tenant_id')?.value || ''
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const supabase = await createClient()
    const repository = new SupabaseTenantRepository(supabase)
    const useCase = new GetTenantWithStatsUseCase(repository)

    const stats = await useCase.execute(tenantId)

    if (!stats) {
      return NextResponse.json({ error: 'Tenant stats not found' }, { status: 404 })
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Error fetching tenant stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tenant stats' },
      { status: 500 }
    )
  }
}

