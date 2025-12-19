import { NextRequest, NextResponse } from 'next/server'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { ApproveEstimateUseCase } from '@/modules/estimate/application/approve-estimate.use-case'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { approvedBy } = body as { approvedBy: string }
    
    if (!approvedBy) {
      return NextResponse.json(
        { error: 'approvedBy is required' },
        { status: 400 }
      )
    }
    
    const repository = new SupabaseEstimateRepository()
    const useCase = new ApproveEstimateUseCase(repository)
    
    const estimate = await useCase.execute(params.id, approvedBy)
    
    return NextResponse.json(estimate)
  } catch (error: any) {
    console.error('Error approving estimate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve estimate' },
      { status: 400 }
    )
  }
}

