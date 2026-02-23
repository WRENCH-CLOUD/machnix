import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { GenerateInvoiceFromEstimateUseCase } from '@/modules/invoice/application/generate-from-estimate.use-case'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

const generateInvoiceSchema = z.object({
  estimateId: z.string().uuid("Invalid estimate ID"),
})

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

    const body = await request.json()
    const { estimateId, isGstBilled = true, discountPercentage = 0 } = body

    const validationResult = generateInvoiceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: "Validation failed",
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const invoiceRepo = new SupabaseInvoiceRepository(supabase, tenantId)
    const estimateRepo = new SupabaseEstimateRepository(supabase, tenantId)
    const useCase = new GenerateInvoiceFromEstimateUseCase(invoiceRepo, estimateRepo)

    const invoice = await useCase.execute({
      estimateId,
      isGstBilled,
      discountPercentage,
    }, tenantId)

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: unknown) {
    console.error('Error generating invoice from estimate:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}
