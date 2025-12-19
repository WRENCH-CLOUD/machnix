import { NextRequest, NextResponse } from 'next/server'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { GetAllEstimatesUseCase } from '@/modules/estimate/application/get-all-estimates.use-case'

export async function GET() {
  try {
    const repository = new SupabaseEstimateRepository()
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
