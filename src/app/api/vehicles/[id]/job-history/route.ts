import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

interface Task {
    id: string
    task_name: string
    action_type: 'LABOR_ONLY' | 'REPLACED'
    task_status: string
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

        // Get currentJobId from query params
        const { searchParams } = new URL(request.url)
        const currentJobId = searchParams.get('currentJobId')

        // Validate ID format (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!vehicleId || !uuidRegex.test(vehicleId)) {
            return NextResponse.json({ error: 'Invalid vehicle ID format' }, { status: 400 })
        }

        const auth = requireAuth(request)
        if (isAuthError(auth)) return auth
        const { tenantId } = auth

        const supabase = await createClient()

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

        // Helper function to get parts worked on from job_card_tasks
        const getPartsWorkedOn = async (jobId: string): Promise<Array<{ name: string; status: 'changed' | 'repaired' }>> => {
            const { data: tasks, error } = await supabase
                .schema('tenant')
                .from('job_card_tasks')
                .select('id, task_name, action_type, task_status')
                .eq('jobcard_id', jobId)
                .is('deleted_at', null)
                .eq('action_type', 'REPLACED')

            if (error || !tasks) {
                return []
            }

            return (tasks as Task[]).map(task => ({
                name: task.task_name,
                status: 'changed' as 'changed' | 'repaired'
            }))
        }

        // If we have a currentJobId, find the job created BEFORE this one
        if (currentJobId && uuidRegex.test(currentJobId)) {
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
                    .select('id, job_number, created_at, status')
                    .eq('vehicle_id', vehicleId)
                    .lt('created_at', currentJob.created_at)
                    .order('created_at', { ascending: false })
                    .limit(1)

                if (!prevError && previousJobs && previousJobs.length > 0) {
                    const job = previousJobs[0]
                    const partsWorkedOn = await getPartsWorkedOn(job.id)

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
                .select('id, job_number, created_at, status')
                .eq('vehicle_id', vehicleId)
                .order('created_at', { ascending: false })
                .limit(1)

            if (!jobsError && recentJobs && recentJobs.length > 0) {
                const job = recentJobs[0]
                const partsWorkedOn = await getPartsWorkedOn(job.id)

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
