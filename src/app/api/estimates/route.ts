import { NextResponse } from 'next/server'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { GetAllEstimatesUseCase } from '@/modules/estimate/application/get-all-estimates.use-case'
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
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const repository = new SupabaseEstimateRepository(supabase, tenantId)
    const useCase = new GetAllEstimatesUseCase(repository)
    
    const estimates = await useCase.execute()
    
    return NextResponse.json(estimates)
  } catch (error: any) {
    console.error('Error fetching estimates:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch estimates' },
      { status: 500 }
    )
  }
}
