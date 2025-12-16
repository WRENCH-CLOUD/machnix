import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/app/modules/customer-management/infrastructure/customer.repository.supabase'
import { GetAllCustomersUseCase } from '@/app/modules/customer-management/application/get-all-customers.use-case'

export async function GET() {
  try {
    const repository = new SupabaseCustomerRepository()
    const useCase = new GetAllCustomersUseCase(repository)
    
    const customers = await useCase.execute()
    
    return NextResponse.json(customers)
  } catch (error: any) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
