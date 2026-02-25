import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { SearchCustomersUseCase } from '@/modules/customer/application/search-customers.use-case'
import { apiGuardRead } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuardRead(request)
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
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
