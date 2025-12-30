import { NextRequest, NextResponse } from "next/server";
import { SupabaseEstimateRepository } from "@/modules/estimate/infrastructure/estimate.repository.supabase";
import { AddEstimateItemUseCase } from "@/modules/estimate/application/add-estimate-item.use-case";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const estimateId = params.id;

    const repository = new SupabaseEstimateRepository();
    const useCase = new AddEstimateItemUseCase(repository);

    const item = await useCase.execute({
      ...body,
      estimateId,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error("Error adding estimate item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add estimate item" },
      { status: 400 }
    );
  }
}
