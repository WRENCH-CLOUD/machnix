import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice-management/infrastructure/invoice.repository.supabase'
import { RecordPaymentUseCase } from '@/modules/invoice-management/application/record-payment.use-case'
import { ensureTenantContext } from '@/lib/supabase/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = ensureTenantContext()
    const body = await request.json()
    
    const repository = new SupabaseInvoiceRepository()
    const useCase = new RecordPaymentUseCase(repository)
    
    const invoice = await useCase.execute(params.id, body, tenantId)
    
    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 400 }
    )
  }
}

