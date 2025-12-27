import { NextRequest, NextResponse } from "next/server";
import { SupabaseInvoiceRepository } from "@/modules/invoice/infrastructure/invoice.repository.supabase";
import { GetInvoiceByJobIdUseCase } from "@/modules/invoice/application/get-invoice-by-job-id.use-case";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
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

    const repository = new SupabaseInvoiceRepository(supabase, tenantId);
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
