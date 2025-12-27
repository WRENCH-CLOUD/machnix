import { NextResponse } from 'next/server'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'
import { GetTenantWithStatsUseCase } from '@/modules/tenant/application/get-tenant-with-stats.usecase'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id

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
