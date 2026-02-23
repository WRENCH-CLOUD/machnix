import { NextRequest, NextResponse } from 'next/server'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { GetAllInvoicesUseCase } from '@/modules/invoice/application/get-all-invoices.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

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
