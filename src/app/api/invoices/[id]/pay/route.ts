import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { RecordPaymentUseCase } from '@/modules/invoice/application/record-payment.use-case'
import { validateRouteId, apiGuardWrite } from '@/lib/auth/api-guard'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const idError = validateRouteId(id, 'invoice')
    if (idError) return idError

    const guard = await apiGuardWrite(request, 'record-payment')
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const body = await request.json()

    // Validate payment amount
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
    }

    // Validate payment method
    const validMethods = ['cash', 'card', 'upi', 'bank_transfer', 'cheque']
    if (!body.method || !validMethods.includes(body.method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const repository = new SupabaseInvoiceRepository(supabase, tenantId)
    const useCase = new RecordPaymentUseCase(repository)

    const result = await useCase.execute(id, { 
      amount: body.amount, 
      mode: body.method 
    }, tenantId)

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 400 }
    )
  }
}

