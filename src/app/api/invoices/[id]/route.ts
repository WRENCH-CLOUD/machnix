// app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


const BUCKET = "invoices";
const SIGN_EXPIRES = 60 * 60; // 1 hour

/** Helper: authorize request and check tenant access */
async function authorizeRequest(req: NextRequest, invoiceId: string) {
  // Get tenant-id from header (set by client)
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return { ok: false, code: 400, message: "Missing tenant-id header" };
  }

  // Create Supabase client (uses cookies for auth)
  const supabase = await createClient();

  // Get current user from session
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ok: false, code: 401, message: "Unauthenticated" };
  }

  // Check if user has access to this tenant
  const { data: userAccess, error: accessErr } = await supabase
    .schema('tenant')
    .from("users")
    .select("id, tenant_id, role")
    .eq("auth_user_id", user.id)
    .eq("tenant_id", tenantId)
    .single();

  if (accessErr || !userAccess) {
    return { ok: false, code: 403, message: "No access to this tenant" };
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
    return { ok: false, code: 404, message: "Invoice not found" };
  }

  return { ok: true, user, invoice: invoiceRow, tenantId };
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

// export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
//   // POST will send the invoice over WhatsApp to a phone number
//   const invoiceId = params.id;
//   const body = await req.json();
//   const { toPhone, message } = body; // e.g. "+919812345678"

//   if (!toPhone) {
//     return NextResponse.json({ error: "Missing toPhone" }, { status: 400 });
//   }

//   const auth = await authorizeRequest(req, invoiceId);
//   if (!auth.ok) {
//     return NextResponse.json({ error: auth.message }, { status: auth.code });
//   }

//   const key = auth.invoice.file_key as string;
//   if (!key) {
//     return NextResponse.json({ error: "Invoice file not found" }, { status: 404 });
//   }

//   // Create a fresh signed URL for WhatsApp
//   const supabase = createClient();
//   const { data: signedData, error: signedError } = await supabase.storage
//     .from(BUCKET)
//     .createSignedUrl(key, SIGN_EXPIRES);

//   if (signedError) {
//     console.error("Signed URL error:", signedError);
//     return NextResponse.json({ error: "Unable to generate signed URL" }, { status: 500 });
//   }

//   const signedUrl = signedData.signedUrl;

//   // Use Twilio to send WhatsApp message with invoice PDF
//   try {
//     if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
//       return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
//     }

//     const twilioClient = new Twilio(
//       process.env.TWILIO_ACCOUNT_SID, 
//       process.env.TWILIO_AUTH_TOKEN
//     );
//     const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`; // e.g. whatsapp:+14155238886
//     const to = `whatsapp:${toPhone}`;

//     const msg = await twilioClient.messages.create({
//       from,
//       to,
//       body: message || "Here is your invoice from our garage",
//       mediaUrl: [signedUrl], // Twilio will fetch the PDF from this signed URL
//     });

//     return NextResponse.json({ 
//       ok: true, 
//       sid: msg.sid,
//       status: msg.status 
//     });
//   } catch (err) {
//     console.error("Twilio send error:", err);
//     return NextResponse.json({ 
//       error: "Failed to send WhatsApp message",
//       details: err instanceof Error ? err.message : "Unknown error"
//     }, { status: 500 });
//   }
// }

/**
 * PATCH /api/invoices/[id]
 * Update invoice GST and discount settings immediately with recalculation
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: invoiceId } = await context.params;
    const body = await req.json();
    const { isGstBilled, discountPercentage } = body;

    const supabase = await createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context missing" }, { status: 400 });
    }

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
