import { NextRequest, NextResponse } from "next/server";
import { SupabaseEstimateRepository } from "@/modules/estimate/infrastructure/estimate.repository.supabase";
import { RemoveEstimateItemUseCase } from "@/modules/estimate/application/remove-estimate-item.use-case";
import { UpdateEstimateItemUseCase } from "@/modules/estimate/application/update-estimate-item.use-case";
import { createClient } from "@/lib/supabase/server";
import { createInventoryAllocationService } from "@/modules/inventory/application/inventory-allocation.service";
import { InsufficientStockError } from "@/modules/inventory/domain/allocation.entity";
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;
    const { userId, tenantId } = auth;

    const supabase = await createClient();

    const { itemId } = await context.params;
    const repository = new SupabaseEstimateRepository(supabase, tenantId);
    const allocationService = createInventoryAllocationService(supabase, tenantId);
    const useCase = new RemoveEstimateItemUseCase(repository, allocationService, supabase, tenantId);

    const result = await useCase.execute(itemId, userId);

    return NextResponse.json({
      success: true,
      released_stock: result.releasedStock ?? null,
    });
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
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;
    const { userId, tenantId } = auth;

    const supabase = await createClient();

    const body = await request.json();
    const { itemId } = await context.params;

    const repository = new SupabaseEstimateRepository(supabase, tenantId);
    const allocationService = createInventoryAllocationService(supabase, tenantId);
    const useCase = new UpdateEstimateItemUseCase(repository, allocationService);

    const result = await useCase.execute({
      itemId,
      customName: body.custom_name,
      customPartNumber: body.custom_part_number,
      description: body.description,
      qty: body.qty,
      unitPrice: body.unit_price,
      laborCost: body.labor_cost,
      createdBy: userId,
    });

    return NextResponse.json({
      ...result.item,
      allocation_adjusted: result.allocationAdjusted ?? false,
      new_allocation_id: result.newAllocationId ?? null,
    });
  } catch (error: any) {
    console.error("Error updating estimate item:", error);

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

    return NextResponse.json(
      { error: error.message || "Failed to update estimate item" },
      { status: 400 }
    );
  }
}

