import { NextResponse } from "next/server";
import {createClient } from "@/lib/supabase/server";
export async function POST(req: Request) {
  const { email, password } = await req.json();
  
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: { message: error?.message || "Authentication failed" } },
      { status: 401 }
    );
  }

  const meta = data.session.user.app_metadata;

  // Return only minimal user info; tokens are NOT returned.
  // Supabase SSR client already set HttpOnly cookies via next/headers cookies adapter.
  return NextResponse.json({
    user: {
      id: data.session.user.id,
      email: data.session.user.email,
      role: meta?.role ?? null,
      tenantId: meta?.tenant_id ?? null,
    },
  });
}
