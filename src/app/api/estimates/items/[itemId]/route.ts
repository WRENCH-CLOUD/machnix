import { NextRequest, NextResponse } from "next/server";
import { SupabaseEstimateRepository } from "@/modules/estimate/infrastructure/estimate.repository.supabase";
import { RemoveEstimateItemUseCase } from "@/modules/estimate/application/remove-estimate-item.use-case";
import { UpdateEstimateItemUseCase } from "@/modules/estimate/application/update-estimate-item.use-case";
import { apiGuardWrite, validateRouteId } from '@/lib/auth/api-guard';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    const idError = validateRouteId(itemId, 'estimate-item');
    if (idError) return idError;

    const guard = await apiGuardWrite(request, 'remove-estimate-item');
    if (!guard.ok) return guard.response;
    const { supabase, tenantId } = guard;
    const repository = new SupabaseEstimateRepository(supabase, tenantId);
    const useCase = new RemoveEstimateItemUseCase(repository);

    await useCase.execute(itemId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing estimate item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove estimate item" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    const idError = validateRouteId(itemId, 'estimate-item');
    if (idError) return idError;

    const guard = await apiGuardWrite(request, 'update-estimate-item');
    if (!guard.ok) return guard.response;
    const { supabase, tenantId } = guard;

    const body = await request.json();

    const repository = new SupabaseEstimateRepository(supabase, tenantId);
    const useCase = new UpdateEstimateItemUseCase(repository);

    const item = await useCase.execute({
      ...body,
      itemId,
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Error updating estimate item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update estimate item" },
      { status: 400 }
    );
  }
}

