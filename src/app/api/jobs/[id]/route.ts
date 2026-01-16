import { NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { DeleteJobUseCase } from '@/modules/job/application/delete-job.use-case'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createClient()
    const repository = new SupabaseJobRepository(supabase)
    const useCase = new DeleteJobUseCase(repository)

    await useCase.execute(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete job' },
      { status: error.message === 'Job not found' ? 404 : 500 }
    )
  }
}
