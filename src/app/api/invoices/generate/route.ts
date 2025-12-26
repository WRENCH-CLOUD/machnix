import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { GenerateInvoiceFromEstimateUseCase } from '@/modules/invoice/application/generate-from-estimate.use-case'
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

    const repository = new SupabaseInvoiceRepository()
    const useCase = new GenerateInvoiceFromEstimateUseCase(repository)

    const invoice = await useCase.execute(body.estimateId, tenantId)

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    console.error('Error generating invoice from estimate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate invoice' },
      { status: 400 }
    )
  }
}
