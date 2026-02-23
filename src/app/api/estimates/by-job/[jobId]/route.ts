import { NextRequest, NextResponse } from "next/server";
import { SupabaseEstimateRepository } from "@/modules/estimate/infrastructure/estimate.repository.supabase";
import { GetEstimateByJobIdUseCase } from "@/modules/estimate/application/get-estimate-by-job-id.use-case";
import { apiGuardRead, validateRouteId } from '@/lib/auth/api-guard';

export async function GET(
  request: NextRequest,
  context:
    | { params: { jobId: string } }
    | { params: Promise<{ jobId: string }> }
) {
  try {
    const resolvedParams = await (context.params as any);
    const { jobId } = resolvedParams as { jobId: string };

    const idError = validateRouteId(jobId, 'job');
    if (idError) return idError;

    const guard = await apiGuardRead(request);
    if (!guard.ok) return guard.response;
    const { supabase, tenantId } = guard;

    const repository = new SupabaseEstimateRepository(supabase, tenantId);
    const useCase = new GetEstimateByJobIdUseCase(repository);

    const estimate = await useCase.execute(jobId);

    if (!estimate) {
      return NextResponse.json(
        { message: "Estimate not found" },
        { status: 404 }
      );
    }

    const partsTotal = (estimate as any).partsTotal ?? 0;
    const laborTotal = (estimate as any).laborTotal ?? 0;
    const subtotal = (estimate as any).subtotal ?? partsTotal + laborTotal;
    const taxAmount = (estimate as any).taxAmount ?? 0;
    const discountAmount = (estimate as any).discountAmount ?? 0;
    const totalAmount =
      (estimate as any).totalAmount ?? subtotal + taxAmount - discountAmount;

    const items = ((estimate as any).items || []) as any[];

    const apiEstimate = {
      id: (estimate as any).id,
      tenant_id: (estimate as any).tenantId,
      customer_id: (estimate as any).customerId,
      vehicle_id: (estimate as any).vehicleId,
      jobcard_id: (estimate as any).jobcardId,
      estimate_number: (estimate as any).estimateNumber,
      status: (estimate as any).status,
      description: (estimate as any).description,
      labor_total: laborTotal,
      parts_total: partsTotal,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
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
      estimate_items: items.map((item) => ({
        id: item.id,
        estimate_id: item.estimate_id ?? item.estimateId,
        part_id: item.part_id ?? item.partId ?? null,
        custom_name: item.custom_name ?? item.customName,
        custom_part_number: item.custom_part_number ?? item.customPartNumber,
        description: item.description ?? null,
        qty: item.qty,
        unit_price: item.unit_price ?? item.unitPrice,
        labor_cost: item.labor_cost ?? item.laborCost ?? 0,
        total:
          item.total ??
          item.qty * (item.unit_price ?? item.unitPrice ?? 0) +
            (item.labor_cost ?? item.laborCost ?? 0),
        created_at: item.created_at
          ? item.created_at
          : item.createdAt
          ? item.createdAt.toISOString()
          : null,
      })),
    };

    return NextResponse.json(apiEstimate);
  } catch (error: any) {
    console.error("Error fetching estimate by job ID:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch estimate" },
      { status: 500 }
    );
  }
}
