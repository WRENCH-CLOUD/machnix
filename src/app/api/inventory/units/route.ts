import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SupabaseUnitRepository } from "@/modules/inventory/infrastructure/inventory.repository.supabase";
import { UnitCrudUseCase } from "@/modules/inventory/application/unit-crud.use-case";
import { requireAuth, isAuthError } from "@/lib/auth-helpers";

const createSchema = z.object({
  unitName: z.string().min(1),
});

/**
 * GET /api/inventory/units
 * List all units for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;
    const { tenantId } = auth;

    const supabase = await createClient();
    const repository = new SupabaseUnitRepository(supabase, tenantId);
    const useCase = new UnitCrudUseCase(repository);

    const units = await useCase.list();
    return NextResponse.json(units);
  } catch (error: unknown) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/units
 * Create (or reuse) a unit for the current tenant.
 * If a unit with the same name already exists for this tenant, that unit is returned.
 */
export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;
    const { tenantId } = auth;

    const json = await request.json();
    const result = createSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 });
    }

    const supabase = await createClient();
    const repository = new SupabaseUnitRepository(supabase, tenantId);
    const useCase = new UnitCrudUseCase(repository);

    const unit = await useCase.create(result.data.unitName);
    return NextResponse.json(unit, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating unit:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
