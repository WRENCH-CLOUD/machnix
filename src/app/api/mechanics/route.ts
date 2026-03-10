import { NextRequest, NextResponse } from 'next/server'
import { SupabaseMechanicRepository } from '@/modules/mechanic/infrastructure/mechanic.repository.supabase'
import { GetMechanicsUseCase } from '@/modules/mechanic/application/get-mechanics.use-case'
import { CreateMechanicUseCase } from '@/modules/mechanic/application/create-mechanic.use-case'
import { apiGuardRead, apiGuardAdmin } from '@/lib/auth/api-guard'

/**
 * GET /api/mechanics
 * List all mechanics for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuardRead(request)
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    // Check for activeOnly query param
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const repository = new SupabaseMechanicRepository(supabase, tenantId)
    const useCase = new GetMechanicsUseCase(repository)

    const mechanics = await useCase.execute(activeOnly)

    return NextResponse.json(mechanics)
  } catch (error: any) {
    console.error('Error fetching mechanics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mechanics' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mechanics
 * Create a new mechanic
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await apiGuardAdmin(request, 'create-mechanic')
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const body = await request.json()

    const repository = new SupabaseMechanicRepository(supabase, tenantId)
    const useCase = new CreateMechanicUseCase(repository)

    const mechanic = await useCase.execute({
      name: body.name,
      phone: body.phone,
      email: body.email,
    })

    return NextResponse.json(mechanic, { status: 201 })
  } catch (error: any) {
    console.error('Error creating mechanic:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create mechanic' },
      { status: 500 }
    )
  }
}
