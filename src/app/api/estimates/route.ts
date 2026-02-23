import { NextRequest, NextResponse } from 'next/server'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { GetAllEstimatesUseCase } from '@/modules/estimate/application/get-all-estimates.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

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
