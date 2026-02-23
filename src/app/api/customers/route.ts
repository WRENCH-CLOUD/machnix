import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { GetAllCustomersUseCase } from '@/modules/customer/application/get-all-customers.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const supabase = await createClient()
    const repository = new SupabaseCustomerRepository(supabase, tenantId)
    const useCase = new GetAllCustomersUseCase(repository)

    const customers = await useCase.execute()

    return NextResponse.json(customers)
  } catch (error: unknown) {
    console.error('Error fetching customers:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch customers'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
