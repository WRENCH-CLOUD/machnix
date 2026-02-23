// app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthError } from '@/lib/auth-helpers'


const BUCKET = "invoices";
const SIGN_EXPIRES = 60 * 60; // 1 hour

/** Helper: authorize request and check tenant access */
async function authorizeRequest(req: NextRequest, invoiceId: string) {
  const auth = requireAuth(req);
  if (isAuthError(auth)) {
    return { ok: false as const, code: 401, message: "Unauthenticated" };
  }
  const { userId, tenantId } = auth;

  if (!tenantId) {
    return { ok: false as const, code: 400, message: "Missing tenant context" };
  }

  // Create Supabase client (uses cookies for auth)
  const supabase = await createClient();

  // Check if user has access to this tenant
  const { data: userAccess, error: accessErr } = await supabase
    .schema('tenant')
    .from("users")
    .select("id, tenant_id, role")
    .eq("auth_user_id", userId)
    .eq("tenant_id", tenantId)
    .single();

  if (accessErr || !userAccess) {
    return { ok: false as const, code: 403, message: "No access to this tenant" };
  }

  // Fetch invoice and verify it belongs to the tenant
  const { data: invoiceRow, error: invErr } = await supabase
    .schema('tenant')
    .from("invoices")
    .select("id, file_key, filename, tenant_id")
    .eq("id", invoiceId)
    .eq("tenant_id", tenantId)
    .single();

  if (invErr || !invoiceRow) {
    return { ok: false as const, code: 404, message: "Invoice not found" };
  }

  return { ok: true as const, userId, invoice: invoiceRow, tenantId };
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: invoiceId } = await context.params;
  const auth = await authorizeRequest(req, invoiceId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.code });
  }

  const invoice = auth.invoice!;
  const key = invoice.file_key as string;
  if (!key) {
    return NextResponse.json({ error: "Invoice file not found" }, { status: 404 });
  }

  // Create Supabase server client and generate signed URL
  const supabase = await createClient();
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key, SIGN_EXPIRES);

  if (signedError) {
    console.error("Signed URL error:", signedError);
    return NextResponse.json({ error: "Unable to generate signed URL" }, { status: 500 });
  }

  const expiresAt = Date.now() + SIGN_EXPIRES * 1000;

  return NextResponse.json({
    signedUrl: signedData.signedUrl,
    expiresAt,
    filename: invoice.filename
  });
}

/**
 * PATCH /api/invoices/[id]
 * Update invoice GST and discount settings immediately with recalculation
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: invoiceId } = await context.params;
    const body = await req.json();
    const { isGstBilled, discountPercentage } = body;

    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;
    const { tenantId } = auth;

    const supabase = await createClient();

    // Fetch current invoice to get subtotal for recalculation
    const { data: invoice, error: fetchError } = await supabase
      .schema('tenant')
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Recalculate amounts based on new GST/discount settings
    const subtotal = Number(invoice.subtotal);
    const newDiscountPercentage = discountPercentage ?? invoice.discount_percentage ?? 0;
    const newIsGstBilled = isGstBilled ?? invoice.is_gst_billed ?? true;

    const discountAmount = subtotal * (newDiscountPercentage / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = newIsGstBilled ? taxableAmount * 0.18 : 0;
    const totalAmount = taxableAmount + taxAmount;
    const balance = totalAmount - Number(invoice.paid_amount || 0);

    // Update invoice with new values
    const { data: updated, error: updateError } = await supabase
      .schema('tenant')
      .from('invoices')
      .update({
        is_gst_billed: newIsGstBilled,
        discount_percentage: newDiscountPercentage,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        balance: balance,
        status: balance <= 0 ? 'paid' : invoice.status,
      })
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating invoice:", updateError);
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update invoice" },
      { status: 500 }
    );
  }
}
