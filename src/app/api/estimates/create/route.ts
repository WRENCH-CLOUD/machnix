import { NextRequest, NextResponse } from 'next/server'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { CreateEstimateUseCase } from '@/modules/estimate/application/create-estimate.usecase'
import { createClient } from '@/lib/supabase/server'
import { JWT_CLAIM_TENANT_ID } from '@/lib/auth/jwt-claims'

async function getTenantIdFromRequest(request: NextRequest): Promise<string> {
  const fromHeader = request.headers.get('x-tenant-id')
  if (fromHeader) return fromHeader
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  const tenantId = (user.app_metadata?.[JWT_CLAIM_TENANT_ID] as string) || null
  if (!tenantId) throw new Error('Missing tenant context in auth claims')
  return tenantId
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const body = await request.json()

    const repository = new SupabaseEstimateRepository()
    const useCase = new CreateEstimateUseCase(repository)

    const estimate = await useCase.execute(body, tenantId)

    return NextResponse.json(estimate, { status: 201 })
  } catch (error: any) {
    console.error('Error creating estimate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create estimate' },
      { status: 400 }
    )
  }
}
