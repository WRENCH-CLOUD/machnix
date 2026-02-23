import { NextRequest, NextResponse } from "next/server";
import { SupabaseInvoiceRepository } from "@/modules/invoice/infrastructure/invoice.repository.supabase";
import { GetInvoiceByJobIdUseCase } from "@/modules/invoice/application/get-invoice-by-job-id.use-case";
import { createClient } from "@/lib/supabase/server";
import { getRouteUser } from '@/lib/auth/get-route-user'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    // Read user from middleware-injected headers (avoids redundant getUser() call)
    const user = getRouteUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context missing" }, { status: 400 });
    }

    const { jobId } = await context.params;
    const supabase = await createClient();

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
