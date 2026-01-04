import { NextRequest, NextResponse } from 'next/server'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'
import { GetTenantWithStatsUseCase } from '@/modules/tenant/application/get-tenant-with-stats.usecase'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isPlatformAdmin = user.app_metadata?.role === 'platform_admin'
    
    // Get tenantId from app_metadata, or from impersonation cookie for platform admins
    let tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    
    if (!tenantId && isPlatformAdmin) {
      // Check for impersonation cookie
      const cookieStore = await cookies()
      tenantId = cookieStore.get('impersonate_tenant_id')?.value
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

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

