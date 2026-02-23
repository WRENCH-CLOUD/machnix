import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseMechanicRepository } from '@/modules/mechanic/infrastructure/mechanic.repository.supabase'
import { UpdateMechanicUseCase } from '@/modules/mechanic/application/update-mechanic.use-case'
import { DeleteMechanicUseCase } from '@/modules/mechanic/application/delete-mechanic.use-case'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

type RouteContext = { params: { id: string } | Promise<{ id: string }> }

/**
 * GET /api/mechanics/[id]
 * Get a single mechanic by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const resolvedParams = await context.params
        const id = resolvedParams.id

        const auth = requireAuth(request)
        if (isAuthError(auth)) return auth
        const { tenantId } = auth

        const supabase = await createClient()
        const repository = new SupabaseMechanicRepository(supabase, tenantId)
        const mechanic = await repository.findById(id)

        if (!mechanic) {
            return NextResponse.json({ error: 'Mechanic not found' }, { status: 404 })
        }

        return NextResponse.json(mechanic)
    } catch (error: any) {
        console.error('Error fetching mechanic:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch mechanic' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/mechanics/[id]
 * Update a mechanic
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const resolvedParams = await context.params
        const id = resolvedParams.id

        const auth = requireAuth(request)
        if (isAuthError(auth)) return auth
        const { tenantId } = auth

        const body = await request.json()

        const supabase = await createClient()
        const repository = new SupabaseMechanicRepository(supabase, tenantId)
        const useCase = new UpdateMechanicUseCase(repository)

        const mechanic = await useCase.execute(id, {
            name: body.name,
            phone: body.phone,
            email: body.email,
            isActive: body.isActive,
        })

        return NextResponse.json(mechanic)
    } catch (error: any) {
        console.error('Error updating mechanic:', error)

        if (error.message === 'Mechanic not found') {
            return NextResponse.json({ error: error.message }, { status: 404 })
        }

        return NextResponse.json(
            { error: error.message || 'Failed to update mechanic' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/mechanics/[id]
 * Soft delete a mechanic
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const resolvedParams = await context.params
        const id = resolvedParams.id

        const auth = requireAuth(request)
        if (isAuthError(auth)) return auth
        const { tenantId } = auth

        const supabase = await createClient()
        const repository = new SupabaseMechanicRepository(supabase, tenantId)
        const useCase = new DeleteMechanicUseCase(repository)

        await useCase.execute(id)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting mechanic:', error)

        if (error.message === 'Mechanic not found') {
            return NextResponse.json({ error: error.message }, { status: 404 })
        }

        return NextResponse.json(
            { error: error.message || 'Failed to delete mechanic' },
            { status: 500 }
        )
    }
}
