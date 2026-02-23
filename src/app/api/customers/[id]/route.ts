import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { GetCustomerByIdUseCase } from '@/modules/customer/application/get-customer-by-id.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const supabase = await createClient()
    const repository = new SupabaseCustomerRepository(supabase, tenantId)
    const useCase = new GetCustomerByIdUseCase(repository)

    const customer = await useCase.execute(id)

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

