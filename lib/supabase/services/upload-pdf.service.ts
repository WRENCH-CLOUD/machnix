// lib/supabase/services/pdf.service.ts
import { supabase } from "../client.js"; // MUST be server client with service_role key
import crypto from "crypto";

export async function uploadPDFPrivateSupabase(fileBuffer: Buffer, filename: string) {
  const bucket = "invoices"; // be consistent with casing
  const fileId = crypto.randomUUID();
  const key = `pdf/${fileId}-${filename.replace(/\s+/g, "_")}`;

  // Upload using Supabase Storage SDK (server side)
  // Node: Buffer is accepted, but you can also use Uint8Array
  const bufferToUpload = fileBuffer instanceof Uint8Array ? fileBuffer : Uint8Array.from(fileBuffer);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(key, bufferToUpload, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw uploadError;
  }

  // Save the key (NOT a public URL) in DB: keeps things stable & secure
  const { data: dbData, error: dbError } = await supabase
    .from("tenant.invoices")
    .insert([ { file_key: key, filename: filename } ])
    .select()
    .single();

  if (dbError) {
    console.error("DB insert error:", dbError);
    // optionally remove the file if DB fails (cleanup)
    throw dbError;
  }

  // Create a signed URL valid for expiresIn seconds
  const expiresIn = 60 * 60; // 1 hour
  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, expiresIn);

  if (signedError) {
    console.error("Signed URL error:", signedError);
    throw signedError;
  }

  return {
    key,
    signedUrl: signedData.signedUrl,
    dbRow: dbData,
  };
}
