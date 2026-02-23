import { NextRequest, NextResponse } from 'next/server'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'
import { GetTenantWithStatsUseCase } from '@/modules/tenant/application/get-tenant-with-stats.usecase'
import { createClient } from '@/lib/supabase/server'
import { getRouteUser } from '@/lib/auth/get-route-user'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Read user from middleware-injected headers (avoids redundant getUser() call)
    const user = getRouteUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenantId — support impersonation for platform admins
    let tenantId = user.tenantId
    
    if (!tenantId && user.isPlatformAdmin) {
      // Check for impersonation cookie
      const cookieStore = await cookies()
      tenantId = cookieStore.get('impersonate_tenant_id')?.value || null
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
