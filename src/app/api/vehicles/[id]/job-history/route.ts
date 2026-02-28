import { NextRequest, NextResponse } from 'next/server'
import { apiGuardRead, validateRouteId, isValidUUID } from '@/lib/auth/api-guard'

interface TodoItem {
    id: string
    text: string
    status: 'changed' | 'repaired' | 'no_change' | null
    completed: boolean
}

interface JobHistoryResponse {
    totalJobs: number
    recentJob: {
        id: string
        jobNumber: string
        createdAt: string
        status: string
        partsWorkedOn: Array<{
            name: string
            status: 'changed' | 'repaired'
        }>
    } | null
}

export async function GET(
    request: NextRequest,
    context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await (context.params as any)
        const vehicleId = (resolvedParams as { id: string }).id

        const idError = validateRouteId(vehicleId, 'vehicle')
        if (idError) return idError

        const guard = await apiGuardRead(request)
        if (!guard.ok) return guard.response
        const { supabase } = guard

        // Get currentJobId from query params
        const { searchParams } = new URL(request.url)
        const currentJobId = searchParams.get('currentJobId')

        // Get all job cards for this vehicle (count)
        const { count, error: countError } = await supabase
            .schema('tenant')
            .from('jobcards')
            .select('*', { count: 'exact', head: true })
            .eq('vehicle_id', vehicleId)

        if (countError) {
            console.error('Error counting jobs:', countError)
            return NextResponse.json({ error: 'Failed to fetch job history' }, { status: 500 })
        }

        let recentJob: JobHistoryResponse['recentJob'] = null

        // If we have a currentJobId, find the job created BEFORE this one
        if (currentJobId && isValidUUID(currentJobId)) {
            // First get the current job's created_at
            const { data: currentJob, error: currentJobError } = await supabase
                .schema('tenant')
                .from('jobcards')
                .select('created_at')
                .eq('id', currentJobId)
                .single()

            if (!currentJobError && currentJob) {
                // Get the most recent job created BEFORE the current one
                const { data: previousJobs, error: prevError } = await supabase
                    .schema('tenant')
                    .from('jobcards')
                    .select('id, job_number, created_at, status, details')
                    .eq('vehicle_id', vehicleId)
                    .lt('created_at', currentJob.created_at)
                    .order('created_at', { ascending: false })
                    .limit(1)

                if (!prevError && previousJobs && previousJobs.length > 0) {
                    const job = previousJobs[0]
                    const todos: TodoItem[] = job.details?.todos || []

                    const partsWorkedOn = todos
                        .filter(todo => todo.status === 'changed' || todo.status === 'repaired')
                        .map(todo => ({
                            name: todo.text,
                            status: todo.status as 'changed' | 'repaired'
                        }))

                    recentJob = {
                        id: job.id,
                        jobNumber: job.job_number,
                        createdAt: job.created_at,
                        status: job.status,
                        partsWorkedOn
                    }
                }
            }
        } else {
            // Fallback: just get the most recent job (for create wizard where there's no current job)
            const { data: recentJobs, error: jobsError } = await supabase
                .schema('tenant')
                .from('jobcards')
                .select('id, job_number, created_at, status, details')
                .eq('vehicle_id', vehicleId)
                .order('created_at', { ascending: false })
                .limit(1)

            if (!jobsError && recentJobs && recentJobs.length > 0) {
                const job = recentJobs[0]
                const todos: TodoItem[] = job.details?.todos || []

                const partsWorkedOn = todos
                    .filter(todo => todo.status === 'changed' || todo.status === 'repaired')
                    .map(todo => ({
                        name: todo.text,
                        status: todo.status as 'changed' | 'repaired'
                    }))

                recentJob = {
                    id: job.id,
                    jobNumber: job.job_number,
                    createdAt: job.created_at,
                    status: job.status,
                    partsWorkedOn
                }
            }
        }

        const response: JobHistoryResponse = {
            totalJobs: count || 0,
            recentJob
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error in GET /api/vehicles/[id]/job-history:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
