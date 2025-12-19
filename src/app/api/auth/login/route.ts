import { NextResponse } from "next/server";
import { supabase } from "src/lib/supabase/client";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // Use Supabase client with cookie support for SSR
  console.log("API LOGIN HIT");


  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? "Login failed" },
      { status: 401 }
    );
  }

  const meta = data.session.user.app_metadata;

  return NextResponse.json({
    user: {
      id: data.session.user.id,
      email: data.session.user.email,
      role: meta?.role ?? null,
      tenantId: meta?.tenant_id ?? null,
    },
  });
}
