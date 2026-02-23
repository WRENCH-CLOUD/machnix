import { NextRequest, NextResponse } from 'next/server'
import { SupabaseUserRepository } from '@/modules/user/infrastructure/user.repository.supabase'
import { DeactivateUserUseCase } from '@/modules/user/application/deactivate-user.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

    const repository = new SupabaseUserRepository(supabase, tenantId)
    const useCase = new DeactivateUserUseCase(repository)
    
    const deactivatedUser = await useCase.execute(id)
    
    return NextResponse.json(deactivatedUser)
  } catch (error: any) {
    console.error('Error deactivating user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate user' },
      { status: 400 }
    )
  }
}

