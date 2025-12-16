import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/app/modules/customer-management/infrastructure/customer.repository.supabase'
import { UpdateCustomerUseCase } from '@/app/modules/customer-management/application/update-customer.use-case'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const repository = new SupabaseCustomerRepository()
    const useCase = new UpdateCustomerUseCase(repository)
    
    const customer = await useCase.execute(params.id, body)
    
    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 400 }
    )
  }
}

