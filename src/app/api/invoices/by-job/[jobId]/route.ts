import { NextRequest, NextResponse } from "next/server";
import { SupabaseInvoiceRepository } from "@/modules/invoice/infrastructure/invoice.repository.supabase";
import { GetInvoiceByJobIdUseCase } from "@/modules/invoice/application/get-invoice-by-job-id.use-case";
import { apiGuardRead, validateRouteId } from '@/lib/auth/api-guard';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params;

    const idError = validateRouteId(jobId, 'job');
    if (idError) return idError;

    const guard = await apiGuardRead(request);
    if (!guard.ok) return guard.response;
    const { supabase, tenantId } = guard;

    const repository = new SupabaseInvoiceRepository(supabase, tenantId);
    const useCase = new GetInvoiceByJobIdUseCase(repository);

    const invoice = await useCase.execute(jobId);

    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error fetching invoice by job ID:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
