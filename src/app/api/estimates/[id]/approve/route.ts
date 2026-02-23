import { NextRequest, NextResponse } from 'next/server'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { ApproveEstimateUseCase } from '@/modules/estimate/application/approve-estimate.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

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

