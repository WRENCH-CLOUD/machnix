import { NextRequest, NextResponse } from 'next/server';
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase';
import { AssignMechanicUseCase } from '@/modules/job/application/assign-mechanic.usecase';
import { apiGuardWrite, validateRouteId } from '@/lib/auth/api-guard';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any);
    const id = (resolvedParams as { id: string }).id;

    const idError = validateRouteId(id, 'job');
    if (idError) return idError;

    const { mechanicId } = await request.json();

    if (!mechanicId) {
      return NextResponse.json({ error: 'Mechanic ID is required' }, { status: 400 });
    }

    const guard = await apiGuardWrite(request, 'assign-mechanic');
    if (!guard.ok) return guard.response;
    const { supabase, tenantId } = guard;

    // Validate mechanic exists and is active
    const { data: mechanic, error: mechanicError } = await supabase
      .schema('tenant')
      .from('mechanics')
      .select('id, name, is_active')
      .eq('id', mechanicId)
      .eq('tenant_id', tenantId)
      .single();

    if (mechanicError || !mechanic) {
      return NextResponse.json({ error: 'Mechanic not found' }, { status: 404 });
    }

    if (mechanic.is_active === false) {
      return NextResponse.json({ error: 'Cannot assign inactive mechanic' }, { status: 400 });
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
