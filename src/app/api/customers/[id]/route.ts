import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { GetCustomerByIdUseCase } from '@/modules/customer/application/get-customer-by-id.use-case'
import { apiGuardRead, validateRouteId } from '@/lib/auth/api-guard'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idError = validateRouteId(id, 'customer')
    if (idError) return idError

    const guard = await apiGuardRead(request)
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const repository = new SupabaseCustomerRepository(supabase, tenantId)
    const useCase = new GetCustomerByIdUseCase(repository)
    
    const customer = await useCase.execute(id)
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

