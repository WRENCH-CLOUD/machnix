import { NextRequest, NextResponse } from "next/server";
import { SupabaseEstimateRepository } from "@/modules/estimate/infrastructure/estimate.repository.supabase";
import { CreateEstimateUseCase } from "@/modules/estimate/application/create-estimate.use-case";
import { apiGuardWrite } from '@/lib/auth/api-guard';

export async function POST(request: NextRequest) {
  try {
    const guard = await apiGuardWrite(request, 'create-estimate');
    if (!guard.ok) return guard.response;
    const { supabase, tenantId, userId } = guard;

    const repository = new SupabaseEstimateRepository(supabase, tenantId);
    const useCase = new CreateEstimateUseCase(repository);

    const raw = await request.json();

    const jobcardId = raw.jobcard_id as string | undefined;

    if (!raw.customer_id || !raw.vehicle_id) {
      return NextResponse.json(
        { error: "customer_id and vehicle_id are required" },
        { status: 400 }
      );
    }

    if (!jobcardId) {
      return NextResponse.json(
        { error: "jobcard_id is required to create an estimate" },
        { status: 400 }
      );
    }

    const existing = await repository.findByJobcardId(jobcardId);
    if (existing.length > 0) {
      const current = await repository.findById(existing[0].id);
      if (current) {
        const apiEstimate = {
          id: (current as any).id,
          tenant_id: tenantId,
          customer_id: (current as any).customerId,
          vehicle_id: (current as any).vehicleId,
          jobcard_id: (current as any).jobcardId,
          estimate_number: (current as any).estimateNumber,
          status: (current as any).status,
          description: (current as any).description,
          labor_total: (current as any).laborTotal ?? 0,
          parts_total: (current as any).partsTotal ?? 0,
          subtotal: (current as any).subtotal ?? 0,
          tax_amount: (current as any).taxAmount ?? 0,
          discount_amount: (current as any).discountAmount ?? 0,
          total_amount: (current as any).totalAmount ?? 0,
          currency: (current as any).currency,
          valid_until: (current as any).validUntil
            ? (current as any).validUntil.toISOString()
            : null,
          created_at: (current as any).createdAt
            ? (current as any).createdAt.toISOString()
            : null,
          updated_at: (current as any).updatedAt
            ? (current as any).updatedAt.toISOString()
            : null,
          estimate_items: (current as any).items ?? [],
        };

        return NextResponse.json(apiEstimate, { status: 200 });
      }
    }

    const dto = {
      customerId: raw.customer_id,
      vehicleId: raw.vehicle_id,
      jobcardId,
      description: raw.description,
      laborTotal: raw.labor_total ?? 0,
      partsTotal: raw.parts_total ?? 0,
      taxAmount: raw.tax_amount ?? 0,
      discountAmount: raw.discount_amount ?? 0,
      currency: raw.currency ?? "INR",
      validUntil: raw.valid_until ? new Date(raw.valid_until) : undefined,
    };

    const estimate = await useCase.execute(dto, tenantId, userId);

    const apiEstimate = {
      id: (estimate as any).id,
      tenant_id: tenantId,
      customer_id: (estimate as any).customerId,
      vehicle_id: (estimate as any).vehicleId,
      jobcard_id: (estimate as any).jobcardId,
      estimate_number: (estimate as any).estimateNumber,
      status: (estimate as any).status,
      description: (estimate as any).description,
      labor_total: (estimate as any).laborTotal ?? 0,
      parts_total: (estimate as any).partsTotal ?? 0,
      subtotal: (estimate as any).subtotal ?? 0,
      tax_amount: (estimate as any).taxAmount ?? 0,
      discount_amount: (estimate as any).discountAmount ?? 0,
      total_amount: (estimate as any).totalAmount ?? 0,
      currency: (estimate as any).currency,
      valid_until: (estimate as any).validUntil
        ? (estimate as any).validUntil.toISOString()
        : null,
      created_at: (estimate as any).createdAt
        ? (estimate as any).createdAt.toISOString()
        : null,
      updated_at: (estimate as any).updatedAt
        ? (estimate as any).updatedAt.toISOString()
        : null,
      estimate_items: [],
    };

    return NextResponse.json(apiEstimate, { status: 201 });
  } catch (error: any) {
    console.error("Error creating estimate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create estimate" },
      { status: 400 }
    );
  }
}
