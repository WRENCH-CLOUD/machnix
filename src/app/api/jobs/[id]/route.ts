import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { apiGuardRead, validateRouteId } from '@/lib/auth/api-guard'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await (context.params as any)
        const id = (resolvedParams as { id: string }).id

        const idError = validateRouteId(id, 'job')
        if (idError) return idError

        const guard = await apiGuardRead(request)
        if (!guard.ok) return guard.response
        const { supabase, tenantId } = guard

        const repository = new SupabaseJobRepository(supabase, tenantId)
        const job = await repository.findById(id)

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        return NextResponse.json(job)
    } catch (error: any) {
        console.error('Error fetching job details:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
