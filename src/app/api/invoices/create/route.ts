import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { CreateInvoiceUseCase } from '@/modules/invoice/application/create-invoice.use-case'
import { apiGuardWrite } from '@/lib/auth/api-guard'
import { z } from 'zod'

const createInvoiceSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  jobcardId: z.string().uuid("Invalid jobcard ID").optional(),
  estimateId: z.string().uuid("Invalid estimate ID").optional(),
  subtotal: z.number().min(0, "Subtotal must be non-negative"),
  taxAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  // Accept string dates and transform to Date objects
  invoiceDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  dueDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  metadata: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const guard = await apiGuardWrite(request, 'create-invoice')
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const body = await request.json()

    // Validate request body
    const validationResult = createInvoiceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: "Validation failed",
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const repository = new SupabaseInvoiceRepository(supabase, tenantId)
    const useCase = new CreateInvoiceUseCase(repository)

    const invoice = await useCase.execute(validationResult.data, tenantId)

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
