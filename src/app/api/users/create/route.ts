import { NextRequest, NextResponse } from 'next/server'
import { SupabaseUserRepository } from '@/modules/user/infrastructure/user.repository.supabase'
import { CreateUserUseCase } from '@/modules/user/application/create-user.use-case'
import { ensureTenantContext } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const tenantId = ensureTenantContext()
    const body = await request.json()
    
    const repository = new SupabaseUserRepository()
    const useCase = new CreateUserUseCase(repository)
    
    const user = await useCase.execute(body, tenantId)
    
    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 400 }
    )
  }
}
