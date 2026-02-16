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
  const userMeta = data.session.user.user_metadata;

  // Return only user info; tokens stay server-side in HttpOnly cookies.
  // Client will reload page to pick up the session.
  return NextResponse.json({
    user: {
      id: data.session.user.id,
      email: data.session.user.email,
      role: meta?.role ?? userMeta?.role ?? null,
      tenantId: meta?.tenant_id ?? userMeta?.tenant_id ?? null,
      subscriptionTier: meta?.subscription_tier ?? userMeta?.subscription_tier ?? null,
    },
  });
}
