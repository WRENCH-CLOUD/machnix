import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { GetAllCustomersUseCase } from '@/modules/customer/application/get-all-customers.use-case'

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
