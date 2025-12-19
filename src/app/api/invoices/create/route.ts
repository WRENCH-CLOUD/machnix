import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice-management/infrastructure/invoice.repository.supabase'
import { CreateInvoiceUseCase } from '@/modules/invoice-management/application/create-invoice.use-case'
import { ensureTenantContext } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const tenantId = ensureTenantContext()
    const body = await request.json()
    
    const repository = new SupabaseInvoiceRepository()
    const useCase = new CreateInvoiceUseCase(repository)
    
    const invoice = await useCase.execute(body, tenantId)
    
    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 400 }
    )
  }
}
