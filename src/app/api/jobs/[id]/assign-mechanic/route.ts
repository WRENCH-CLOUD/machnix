import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase';
import { AssignMechanicUseCase } from '@/modules/job/application/assign-mechanic.usecase';

export async function POST(
  request: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any);
    const id = (resolvedParams as { id: string }).id;
    const { mechanicId } = await request.json();

    if (!mechanicId) {
      return NextResponse.json({ error: 'Mechanic ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 403 });
    }

    const repository = new SupabaseJobRepository(supabase, tenantId);
    const useCase = new AssignMechanicUseCase(repository);

    const updatedJob = await useCase.execute(id, mechanicId);

    return NextResponse.json(updatedJob);
  } catch (error: any) {
    console.error('[AssignMechanic] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign mechanic' },
      { status: 500 }
    );
  }
}
