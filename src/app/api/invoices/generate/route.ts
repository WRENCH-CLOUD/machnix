import { NextRequest, NextResponse } from "next/server";
import { SupabaseInvoiceRepository } from "@/app/modules/invoice-management/infrastructure/invoice.repository.supabase";
import { SupabaseEstimateRepository } from "@/app/modules/estimate-management/infrastructure/estimate.repository.supabase";
import { GenerateInvoiceFromEstimateUseCase } from "@/app/modules/invoice-management/application/generate-invoice-from-estimate.use-case";
import { ensureTenantContext } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const tenantId = ensureTenantContext();
    const body = await request.json();
    const { jobcardId, estimateId } = body;

    if (!jobcardId || !estimateId) {
      return NextResponse.json(
        { error: "jobcardId and estimateId are required" },
        { status: 400 }
      );
    }

    const invoiceRepository = new SupabaseInvoiceRepository();
    const estimateRepository = new SupabaseEstimateRepository();
    const useCase = new GenerateInvoiceFromEstimateUseCase(
      invoiceRepository,
      estimateRepository
    );

    const invoice = await useCase.execute(jobcardId, estimateId, tenantId);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
