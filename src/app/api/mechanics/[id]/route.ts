import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseMechanicRepository } from '@/modules/mechanic/infrastructure/mechanic.repository.supabase'
import { UpdateMechanicUseCase } from '@/modules/mechanic/application/update-mechanic.use-case'
import { DeleteMechanicUseCase } from '@/modules/mechanic/application/delete-mechanic.use-case'

type RouteContext = { params: { id: string } | Promise<{ id: string }> }

/**
 * GET /api/mechanics/[id]
 * Get a single mechanic by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const resolvedParams = await context.params
        const id = resolvedParams.id

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
        }

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

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
        }

        const body = await request.json()

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

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
        }

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
