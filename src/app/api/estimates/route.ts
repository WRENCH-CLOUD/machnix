import { NextRequest, NextResponse } from 'next/server'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { GetAllEstimatesUseCase } from '@/modules/estimate/application/get-all-estimates.use-case'
import { apiGuardRead } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuardRead(request)
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

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
