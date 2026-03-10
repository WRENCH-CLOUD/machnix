import { NextRequest, NextResponse } from 'next/server'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { ApproveEstimateUseCase } from '@/modules/estimate/application/approve-estimate.use-case'
import { apiGuardAdmin, validateRouteId } from '@/lib/auth/api-guard'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idError = validateRouteId(id, 'estimate')
    if (idError) return idError

    const guard = await apiGuardAdmin(request, 'approve-estimate')
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const body = await request.json()
    const { approvedBy } = body as { approvedBy: string }
    
    if (!approvedBy) {
      return NextResponse.json(
        { error: 'approvedBy is required' },
        { status: 400 }
      )
    }
    
    const repository = new SupabaseEstimateRepository(supabase, tenantId)
    const useCase = new ApproveEstimateUseCase(repository)
    
    const estimate = await useCase.execute(id, approvedBy)
    
    return NextResponse.json(estimate)
  } catch (error: any) {
    console.error('Error approving estimate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve estimate' },
      { status: 400 }
    )
  }
}

