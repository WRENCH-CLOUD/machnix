import { NextRequest, NextResponse } from 'next/server'
import { SupabaseUserRepository } from '@/modules/user/infrastructure/user.repository.supabase'
import { DeactivateUserUseCase } from '@/modules/user/application/deactivate-user.use-case'
import { apiGuardAdmin, validateRouteId } from '@/lib/auth/api-guard'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Validate UUID format
    const idError = validateRouteId(id, 'user')
    if (idError) return idError

    // SECURITY: Only tenant owners and admins can deactivate users
    const guard = await apiGuardAdmin(request, 'deactivate-user')
    if (!guard.ok) return guard.response

    const { tenantId, supabase } = guard

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

