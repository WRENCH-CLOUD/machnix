import { NextRequest, NextResponse } from "next/server";
import { SupabaseEstimateRepository } from "@/modules/estimate/infrastructure/estimate.repository.supabase";
import { AddEstimateItemUseCase } from "@/modules/estimate/application/add-estimate-item.use-case";
import { createClient } from "@/lib/supabase/server";
import { createInventoryAllocationService } from "@/modules/inventory/application/inventory-allocation.service";
import { InsufficientStockError } from "@/modules/inventory/domain/allocation.entity";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: estimateId } = await context.params;

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
    const allocationService = createInventoryAllocationService(supabase, tenantId);
    const useCase = new AddEstimateItemUseCase(repository, allocationService);

    const result = await useCase.execute({
      estimateId,
      partId: raw.part_id,
      customName: raw.custom_name,
      customPartNumber: raw.custom_part_number,
      description: raw.description,
      qty: raw.qty,
      unitPrice: raw.unit_price,
      laborCost: raw.labor_cost,
      createdBy: user.id,
    });

    const item = result.item;
    const apiItem = {
      id: item.id,
      estimate_id: item.estimateId,
      part_id: item.partId ?? null,
      custom_name: item.customName,
      custom_part_number: item.customPartNumber,
      description: item.description,
      qty: item.qty,
      unit_price: item.unitPrice,
      labor_cost: item.laborCost ?? 0,
      total: item.total ?? item.qty * item.unitPrice + (item.laborCost ?? 0),
      created_at: item.createdAt ? item.createdAt.toISOString() : null,
      allocation_id: result.allocationId ?? null,
      stock_reserved: result.stockReserved ?? null,
    };

    return NextResponse.json(apiItem, { status: 201 });
  } catch (error: unknown) {
    console.error("Error adding estimate item:", error);
    
    // Handle insufficient stock error specifically
    if (error instanceof InsufficientStockError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: 'INSUFFICIENT_STOCK',
          requested: error.requested,
          available: error.available,
        },
        { status: 409 }
      );
    }
    
    const message = error instanceof Error ? error.message : "Failed to add estimate item";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
