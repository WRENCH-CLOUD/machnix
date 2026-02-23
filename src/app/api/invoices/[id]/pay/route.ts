import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { RecordPaymentUseCase } from '@/modules/invoice/application/record-payment.use-case'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Validate ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID format' }, { status: 400 })
    }

    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    // Rate limit payment operations strictly
    const rateLimitResult = checkUserRateLimit(userId, RATE_LIMITS.PAYMENT, 'record-payment')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const supabase = await createClient()

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

