import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase';
import { AssignMechanicUseCase } from '@/modules/job/application/assign-mechanic.usecase';
import { requireAuth, isAuthError } from '@/lib/auth-helpers';

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

    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;
    const { tenantId } = auth;

    const supabase = await createClient();

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
