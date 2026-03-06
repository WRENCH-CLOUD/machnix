import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { GetAllCustomersUseCase } from '@/modules/customer/application/get-all-customers.use-case'
import { apiGuardRead } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuardRead(request)
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const repository = new SupabaseCustomerRepository(supabase, tenantId)
    const useCase = new GetAllCustomersUseCase(repository)
    
    const customers = await useCase.execute()
    
    return NextResponse.json(customers)
  } catch (error: unknown) {
    console.error('Error fetching customers:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch customers'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
