import { NextRequest, NextResponse } from 'next/server'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { CreateEstimateUseCase } from '@/modules/estimate/application/create-estimate.use-case'
import { ensureTenantContext } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const tenantId = ensureTenantContext()
    const body = await request.json()
    
    const createdBy = body.createdBy
    
    const repository = new SupabaseEstimateRepository()
    const useCase = new CreateEstimateUseCase(repository)
    
    const estimate = await useCase.execute(body, tenantId, createdBy)
    
    return NextResponse.json(estimate, { status: 201 })
  } catch (error: any) {
    console.error('Error creating estimate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create estimate' },
      { status: 400 }
    )
  }
}
