// app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiGuardRead, apiGuardWrite, validateRouteId } from '@/lib/auth/api-guard';


const BUCKET = "invoices";
const SIGN_EXPIRES = 60 * 60; // 1 hour

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: invoiceId } = await context.params;

  // Validate UUID format
  const idError = validateRouteId(invoiceId, 'invoice');
  if (idError) return idError;

  // SECURITY: Use JWT-based tenant_id, NOT client-supplied x-tenant-id header
  const guard = await apiGuardRead(req);
  if (!guard.ok) return guard.response;

  const { tenantId, supabase } = guard;

  // Fetch invoice and verify it belongs to the tenant
  const { data: invoice, error: invErr } = await supabase
    .schema('tenant')
    .from("invoices")
    .select("id, file_key, filename, tenant_id")
    .eq("id", invoiceId)
    .eq("tenant_id", tenantId)
    .single();

  if (invErr || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const key = invoice.file_key as string;
  if (!key) {
    return NextResponse.json({ error: "Invoice file not found" }, { status: 404 });
  }

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

    // Validate UUID format
    const idError = validateRouteId(invoiceId, 'invoice');
    if (idError) return idError;

    const body = await req.json();
    const { isGstBilled, discountPercentage } = body;

    // SECURITY: Use JWT-based tenant_id, NOT client-supplied values
    const guard = await apiGuardWrite(req, 'update-invoice');
    if (!guard.ok) return guard.response;

    const { tenantId, supabase } = guard;

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
