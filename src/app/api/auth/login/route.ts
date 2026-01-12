import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter';

export async function POST(req: Request) {
  // Rate limit: 10 attempts per minute per IP to prevent brute force attacks
  const rateLimitResult = checkRateLimit(req, RATE_LIMITS.AUTH, 'login');
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

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
