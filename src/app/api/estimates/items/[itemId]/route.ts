import { NextRequest, NextResponse } from "next/server";
import { SupabaseEstimateRepository } from "@/modules/estimate/infrastructure/estimate.repository.supabase";
import { RemoveEstimateItemUseCase } from "@/modules/estimate/application/remove-estimate-item.use-case";
import { UpdateEstimateItemUseCase } from "@/modules/estimate/application/update-estimate-item.use-case";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context missing" }, { status: 400 });
    }

    const itemId = params.itemId;
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
  { params }: { params: { itemId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context missing" }, { status: 400 });
    }

    const body = await request.json();
    const itemId = params.itemId;

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
