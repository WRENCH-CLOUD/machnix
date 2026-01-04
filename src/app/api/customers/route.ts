import {  NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { GetAllCustomersUseCase } from '@/modules/customer/application/get-all-customers.use-case'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const repository = new SupabaseCustomerRepository(supabase, tenantId)
    const useCase = new GetAllCustomersUseCase(repository)
    
    const customers = await useCase.execute()
    
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
