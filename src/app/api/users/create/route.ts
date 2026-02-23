import { NextRequest, NextResponse } from 'next/server'
import { SupabaseUserRepository } from '@/modules/user/infrastructure/user.repository.supabase'
import { CreateUserUseCase } from '@/modules/user/application/create-user.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

    const body = await request.json()

    const repository = new SupabaseUserRepository(supabase, tenantId)
    const useCase = new CreateUserUseCase(repository)

    const newUser = await useCase.execute(body, tenantId)

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 400 }
    )
  }
}
