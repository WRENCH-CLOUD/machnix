import { NextRequest, NextResponse } from "next/server";
import { SupabaseEstimateRepository } from "@/modules/estimate/infrastructure/estimate.repository.supabase";
import { AddEstimateItemUseCase } from "@/modules/estimate/application/add-estimate-item.use-case";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context:
    | { params: { id: string } }
    | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any);
    const { id: estimateId } = resolvedParams as { id: string };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId =
      user.app_metadata.tenant_id || user.user_metadata.tenant_id;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant context missing" },
        { status: 400 }
      );
    }

    const raw = await request.json();

    const repository = new SupabaseEstimateRepository(supabase, tenantId);
    const useCase = new AddEstimateItemUseCase(repository);

    const item = await useCase.execute({
      estimateId,
      partId: raw.part_id,
      customName: raw.custom_name,
      customPartNumber: raw.custom_part_number,
      description: raw.description,
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
      description: (item as any).description,
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
