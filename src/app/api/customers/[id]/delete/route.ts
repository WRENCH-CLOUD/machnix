import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { DeleteCustomerUseCase } from '@/modules/customer/application/delete-customer.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function DELETE(
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
    const useCase = new DeleteCustomerUseCase(repository)

    await useCase.execute(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 400 }
    )
  }
}

