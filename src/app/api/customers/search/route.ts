import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { SearchCustomersUseCase } from '@/modules/customer/application/search-customers.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const supabase = await createClient()
    const repository = new SupabaseCustomerRepository(supabase, tenantId)
    const useCase = new SearchCustomersUseCase(repository)

    const customers = await useCase.execute(query)

    return NextResponse.json(customers)
  } catch (error: any) {
    console.error('Error searching customers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search customers' },
      { status: 500 }
    )
  }
}
