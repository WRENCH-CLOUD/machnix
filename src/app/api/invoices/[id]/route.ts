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
  const supabase = createClient();

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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const invoiceId = params.id;
  const auth = await authorizeRequest(req, invoiceId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.code });
  }

  const key = auth.invoice.file_key as string;
  if (!key) {
    return NextResponse.json({ error: "Invoice file not found" }, { status: 404 });
  }

  // Create Supabase server client and generate signed URL
  const supabase = createClient();
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
    filename: auth.invoice.filename 
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
