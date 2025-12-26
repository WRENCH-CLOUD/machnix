import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { CreateJobUseCase } from '@/modules/job/application/create-job.use-case'
import { createClient } from '@/lib/supabase/server'
import { JWT_CLAIM_TENANT_ID } from '@/lib/auth/jwt-claims'

async function getTenantIdFromRequest(request: NextRequest): Promise<string> {
  const fromHeader = request.headers.get('x-tenant-id')
  if (fromHeader) return fromHeader
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  const tenantId = (user.app_metadata?.[JWT_CLAIM_TENANT_ID] as string) || null
  if (!tenantId) throw new Error('Missing tenant context in auth claims')
  return tenantId
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const body = await request.json()
    
    // Get user ID from session if available
    const createdBy = body.createdBy // Can be extracted from auth session
    
    const repository = new SupabaseJobRepository()
    const useCase = new CreateJobUseCase(repository)
    
    const job = await useCase.execute(body, tenantId, createdBy)
    
    return NextResponse.json(job, { status: 201 })
  } catch (error: any) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 400 }
    )
  }
}
