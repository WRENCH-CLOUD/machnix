import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { SearchCustomersUseCase } from '@/modules/customer/application/search-customers.use-case'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    const repository = new SupabaseCustomerRepository()
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
