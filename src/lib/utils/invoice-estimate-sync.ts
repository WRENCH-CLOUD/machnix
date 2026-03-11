import { SupabaseClient } from "@supabase/supabase-js";

const GST_RATE = 0.18;

/**
 * After estimate items are mutated (add/remove/update), the estimate's
 * recalculateTotals() runs on the DB side. This function propagates those
 * updated totals to the linked invoice, respecting the invoice's own
 * isGstBilled and discountPercentage settings.
 *
 * Only updates invoices that are not yet fully paid (status !== 'paid').
 */
export async function syncInvoiceToEstimate(
  supabase: SupabaseClient,
  tenantId: string,
  estimateId: string
): Promise<void> {
  try {
    // Get the freshly recalculated estimate subtotal and its linked jobcard
    const { data: estimate } = await supabase
      .schema("tenant")
      .from("estimates")
      .select("jobcard_id, subtotal")
      .eq("id", estimateId)
      .eq("tenant_id", tenantId)
      .single();

    if (!estimate?.jobcard_id) return;

    // Find the invoice for this job (one invoice per job)
    const { data: invoices } = await supabase
      .schema("tenant")
      .from("invoices")
      .select("id, is_gst_billed, discount_percentage, paid_amount, status")
      .eq("jobcard_id", estimate.jobcard_id)
      .eq("tenant_id", tenantId)
      .limit(1);

    if (!invoices?.length) return;

    const invoice = invoices[0];
    if (invoice.status === "paid") return; // Never mutate a paid invoice

    const subtotal: number = estimate.subtotal ?? 0;
    const discountPercentage: number = invoice.discount_percentage ?? 0;
    const isGstBilled: boolean = invoice.is_gst_billed ?? true;
    const paidAmount: number = invoice.paid_amount ?? 0;

    const discountAmount = subtotal * (discountPercentage / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = isGstBilled ? taxableAmount * GST_RATE : 0;
    const totalAmount = taxableAmount + taxAmount;
    const balance = totalAmount - paidAmount;

    await supabase
      .schema("tenant")
      .from("invoices")
      .update({
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        balance,
      })
      .eq("id", invoice.id)
      .eq("tenant_id", tenantId);
  } catch (err) {
    // Log but don't propagate — item mutation already succeeded
    console.error("[syncInvoiceToEstimate] Failed to sync invoice:", err);
  }
}
