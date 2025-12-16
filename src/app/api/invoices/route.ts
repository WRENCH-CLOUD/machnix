import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/app/modules/invoice-management/infrastructure/invoice.repository.supabase'
import { GetAllInvoicesUseCase } from '@/app/modules/invoice-management/application/get-all-invoices.use-case'

export async function GET() {
  try {
    const repository = new SupabaseInvoiceRepository()
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
