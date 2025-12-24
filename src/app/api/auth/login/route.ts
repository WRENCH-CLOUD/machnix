import { NextResponse } from "next/server";
import {createClient } from "@/lib/supabase/server";
export async function POST(req: Request) {
  const { email, password } = await req.json();
  
  console.log("Login attempt with:", email, password);

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error },
      { status: 401 }
    );
  }

  const meta = data.session.user.app_metadata;
  console.log("User metadata:", meta);
  return NextResponse.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
    },
    user: {
      id: data.session.user.id,
      email: data.session.user.email,
      role: meta?.role ?? null,
      tenantId: meta?.tenant_id ?? null,
    },
  });
}
