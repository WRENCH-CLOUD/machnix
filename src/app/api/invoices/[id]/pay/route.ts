import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { RecordPaymentUseCase } from '@/modules/invoice/application/record-payment.use-case'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const repository = new SupabaseInvoiceRepository(supabase, tenantId)
    const useCase = new RecordPaymentUseCase(repository)

    const result = await useCase.execute(params.id, { 
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

