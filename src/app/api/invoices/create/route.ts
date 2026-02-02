import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { CreateInvoiceUseCase } from '@/modules/invoice/application/create-invoice.use-case'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createInvoiceSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  jobcardId: z.string().uuid("Invalid jobcard ID").optional(),
  estimateId: z.string().uuid("Invalid estimate ID").optional(),
  subtotal: z.number().min(0, "Subtotal must be positive"),
  taxAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  // Accept string dates and transform to Date objects
  invoiceDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  dueDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  metadata: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const body = await request.json()

    // Validate request body
    const validatedBody = createInvoiceSchema.parse(body)

    const repository = new SupabaseInvoiceRepository(supabase, tenantId)
    const useCase = new CreateInvoiceUseCase(repository)

    const invoice = await useCase.execute(validatedBody, tenantId)

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invoice' },
      { status: 400 }
    )
  }
}
