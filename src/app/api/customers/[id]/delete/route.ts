import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { DeleteCustomerUseCase } from '@/modules/customer/application/delete-customer.use-case'
import { apiGuardWrite, validateRouteId } from '@/lib/auth/api-guard'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idError = validateRouteId(id, 'customer')
    if (idError) return idError

    const guard = await apiGuardWrite(request, 'delete-customer')
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const repository = new SupabaseCustomerRepository(supabase, tenantId)
    const useCase = new DeleteCustomerUseCase(repository)
    
    await useCase.execute(id)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 400 }
    )
  }
}

