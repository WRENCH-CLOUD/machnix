import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { CreateInvoiceUseCase } from '@/modules/invoice/application/create-invoice.use-case'
import { createClient } from '@/lib/supabase/server'

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

    const repository = new SupabaseInvoiceRepository(supabase, tenantId)
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
