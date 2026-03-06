import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { UpdateCustomerUseCase } from '@/modules/customer/application/update-customer.use-case'
import { apiGuardWrite, validateRouteId } from '@/lib/auth/api-guard'

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any)
    const id = (resolvedParams as { id: string }).id
    const idError = validateRouteId(id, 'customer')
    if (idError) return idError

    const guard = await apiGuardWrite(request, 'update-customer')
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const body = await request.json()
    
    const repository = new SupabaseCustomerRepository(supabase, tenantId)
    const useCase = new UpdateCustomerUseCase(repository)
    
    const customer = await useCase.execute(id, body)
    
    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 400 }
    )
  }
}

