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

    // Accept both API snake_case and internal camelCase field names.
    // Frontend sends snake_case (unit_price/labor_cost), while use-case expects camelCase.
    const normalizedInput = {
      itemId,
      qty: body.qty,
      customName: body.customName ?? body.custom_name,
      customPartNumber: body.customPartNumber ?? body.custom_part_number,
      unitPrice: body.unitPrice ?? body.unit_price,
      laborCost: body.laborCost ?? body.labor_cost,
      createdBy: body.createdBy ?? body.created_by,
    };

    const repository = new SupabaseEstimateRepository(supabase, tenantId);
    const useCase = new UpdateEstimateItemUseCase(repository);

    const item = await useCase.execute(normalizedInput);

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Error updating estimate item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update estimate item" },
      { status: 400 }
    );
  }
}

