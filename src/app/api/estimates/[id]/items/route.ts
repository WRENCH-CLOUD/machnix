import { NextRequest, NextResponse } from "next/server";
import { SupabaseEstimateRepository } from "@/modules/estimate/infrastructure/estimate.repository.supabase";
import { AddEstimateItemUseCase } from "@/modules/estimate/application/add-estimate-item.use-case";
import { apiGuardWrite, validateRouteId } from '@/lib/auth/api-guard';

export async function POST(
  request: NextRequest,
  context:
    | { params: { id: string } }
    | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any);
    const { id: estimateId } = resolvedParams as { id: string };

    const idError = validateRouteId(estimateId, 'estimate');
    if (idError) return idError;

    const guard = await apiGuardWrite(request, 'add-estimate-item');
    if (!guard.ok) return guard.response;
    const { supabase, tenantId } = guard;

    const raw = await request.json();

    const repository = new SupabaseEstimateRepository(supabase, tenantId);
    const useCase = new AddEstimateItemUseCase(repository);

    const item = await useCase.execute({
      estimateId,
      customName: raw.custom_name,
      customPartNumber: raw.custom_part_number,
      qty: raw.qty,
      unitPrice: raw.unit_price,
      laborCost: raw.labor_cost,
    });

    const apiItem = {
      id: (item as any).id,
      estimate_id: (item as any).estimateId,
      part_id: (item as any).partId ?? null,
      custom_name: (item as any).customName,
      custom_part_number: (item as any).customPartNumber,
      qty: (item as any).qty,
      unit_price: (item as any).unitPrice,
      labor_cost: (item as any).laborCost ?? 0,
      total:
        (item as any).total ??
        (item as any).qty * (item as any).unitPrice +
          ((item as any).laborCost ?? 0),
      created_at: (item as any).createdAt
        ? (item as any).createdAt.toISOString()
        : null,
    };

    return NextResponse.json(apiItem, { status: 201 });
  } catch (error: any) {
    console.error("Error adding estimate item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add estimate item" },
      { status: 400 }
    );
  }
}
