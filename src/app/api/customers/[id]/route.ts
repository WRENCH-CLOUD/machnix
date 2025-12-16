import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/app/modules/customer-management/infrastructure/customer.repository.supabase'
import { GetCustomerByIdUseCase } from '@/app/modules/customer-management/application/get-customer-by-id.use-case'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repository = new SupabaseCustomerRepository()
    const useCase = new GetCustomerByIdUseCase(repository)
    
    const customer = await useCase.execute(params.id)
    
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

