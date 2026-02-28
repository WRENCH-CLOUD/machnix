import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { GetAllInvoicesUseCase } from '@/modules/invoice/application/get-all-invoices.use-case'
import { apiGuardRead } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuardRead(request)
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const repository = new SupabaseInvoiceRepository(supabase, tenantId)
    const useCase = new GetAllInvoicesUseCase(repository)
    
    const invoices = await useCase.execute()
    
    return NextResponse.json(invoices)
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
