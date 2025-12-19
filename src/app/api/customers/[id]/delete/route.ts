import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { DeleteCustomerUseCase } from '@/modules/customer/application/delete-customer.use-case'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repository = new SupabaseCustomerRepository()
    const useCase = new DeleteCustomerUseCase(repository)
    
    await useCase.execute(params.id)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 400 }
    )
  }
}

