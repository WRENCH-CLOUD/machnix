import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { CreateJobUseCase } from '@/modules/job/application/create-job.use-case'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Todo item schema for validation
const todoItemSchema = z.object({
  id: z.string(),
  text: z.string().max(500, 'Task text too long'),
  completed: z.boolean(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
})

// Input validation schema
const createJobSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID format'),
  vehicleId: z.string().uuid('Invalid vehicle ID format'),
  description: z.string().max(2000, 'Description too long').optional(),
  notes: z.string().max(5000, 'Notes too long').optional(),
  assignedMechanicId: z.string().uuid('Invalid mechanic ID').optional().transform(v => v ?? undefined),
  serviceType: z.string().max(100, 'Service type too long').optional(),
  priority: z.enum(['low', 'normal', 'medium', 'high', 'urgent']).optional(),
  estimatedCompletion: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  todos: z.array(todoItemSchema).max(50, 'Too many tasks').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const rawBody = await request.json()
    
    // Validate input
    const parseResult = createJobSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const body = parseResult.data
    
    // Use user ID from auth session
    const createdBy = user.id
    
    // Create the job
    const jobRepository = new SupabaseJobRepository(supabase, tenantId)
    const estimateRepository = new SupabaseEstimateRepository(supabase, tenantId)
    const createJobUseCase = new CreateJobUseCase(jobRepository, estimateRepository)
    const job = await createJobUseCase.execute(body, tenantId, createdBy)
    
    return NextResponse.json(job, { status: 201 })
  } catch (error: any) {
    console.error('Error creating job:', {
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack
    })
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 400 }
    )
  }
}
