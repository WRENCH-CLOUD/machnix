import { NextRequest, NextResponse } from 'next/server'
import { SupabaseUserRepository } from '@/modules/user/infrastructure/user.repository.supabase'
import { CreateUserUseCase } from '@/modules/user/application/create-user.use-case'
import { apiGuardAdmin } from '@/lib/auth/api-guard'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only tenant owners and admins can create users
    const guard = await apiGuardAdmin(request, 'create-user')
    if (!guard.ok) return guard.response

    const {tenantId, supabase } = guard

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
