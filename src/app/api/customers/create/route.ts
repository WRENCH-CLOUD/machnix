import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/app/modules/customer-management/infrastructure/customer.repository.supabase'
import { CreateCustomerUseCase } from '@/app/modules/customer-management/application/create-customer.use-case'
import { ensureTenantContext } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const tenantId = ensureTenantContext()
    const body = await request.json()
    
    const repository = new SupabaseCustomerRepository()
    const useCase = new CreateCustomerUseCase(repository)
    
    const customer = await useCase.execute(body, tenantId)
    
    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 400 }
    )
  }
}
