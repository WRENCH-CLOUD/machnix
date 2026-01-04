import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { SearchCustomersUseCase } from '@/modules/customer/application/search-customers.use-case'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    const repository = new SupabaseCustomerRepository(supabase, tenantId)
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
