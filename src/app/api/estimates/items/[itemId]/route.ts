import { NextRequest, NextResponse } from "next/server";
import { SupabaseEstimateRepository } from "@/app/modules/estimate/infrastructure/estimate.repository.supabase";
import { RemoveEstimateItemUseCase } from "@/app/modules/estimate/application/remove-estimate-item.use-case";
import { UpdateEstimateItemUseCase } from "@/app/modules/estimate/application/update-estimate-item.use-case";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const itemId = params.itemId;
    const repository = new SupabaseEstimateRepository();
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
  { params }: { params: { itemId: string } }
) {
  try {
    const body = await request.json();
    const itemId = params.itemId;

    const repository = new SupabaseEstimateRepository();
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
