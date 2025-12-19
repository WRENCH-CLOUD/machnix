import { NextResponse } from "next/server";
import {supabase } from "@/lib/supabase/client";

export async function GET() {
  

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const meta = user.app_metadata ;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: meta?.role ?? null,
      tenantId: meta?.tenant_id ?? null,
    },
  });
}
