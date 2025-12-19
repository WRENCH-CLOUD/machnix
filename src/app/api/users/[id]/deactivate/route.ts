import { NextRequest, NextResponse } from 'next/server'
import { SupabaseUserRepository } from '@/modules/user/infrastructure/user.repository.supabase'
import { DeactivateUserUseCase } from '@/modules/user/application/deactivate-user.use-case'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repository = new SupabaseUserRepository()
    const useCase = new DeactivateUserUseCase(repository)
    
    const user = await useCase.execute(params.id)
    
    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error deactivating user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate user' },
      { status: 400 }
    )
  }
}

