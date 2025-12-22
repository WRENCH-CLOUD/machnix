import { NextRequest, NextResponse } from "next/server";
import { SupabaseInvoiceRepository } from "@/app/modules/invoice-management/infrastructure/invoice.repository.supabase";
import { GetInvoiceByJobIdUseCase } from "@/app/modules/invoice-management/application/get-invoice-by-job-id.use-case";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const repository = new SupabaseInvoiceRepository();
    const useCase = new GetInvoiceByJobIdUseCase(repository);

    const invoice = await useCase.execute(params.jobId);

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
