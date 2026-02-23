import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const meta = user.app_metadata;
  const isPlatformAdmin = meta?.role === 'platform_admin';

  // Check for impersonation cookie (only valid for platform admins)
  let impersonatedTenantId: string | null = null;
  if (isPlatformAdmin) {
    const cookieStore = await cookies();
    impersonatedTenantId = cookieStore.get('impersonate_tenant_id')?.value || null;
  }

  // Use impersonated tenant ID if admin is impersonating, otherwise use their own tenant
  const effectiveTenantId = impersonatedTenantId || (meta?.tenant_id ?? null);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: meta?.role ?? null,
      tenantId: effectiveTenantId,
      isImpersonating: !!impersonatedTenantId,
      originalTenantId: meta?.tenant_id ?? null,
    },
  });
}

