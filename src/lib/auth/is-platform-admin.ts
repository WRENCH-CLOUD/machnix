import { createClient } from "@/lib/supabase/server";

interface EnsurePlatformAdminResult {
  ok: boolean;
  status?: number;
  message?: string;
  user?: any;
}

/**
 * Ensures the current authenticated user is a platform admin.
 * Uses the server-side Supabase client (SSR) to read the session from cookies.
 */
export async function ensurePlatformAdmin(): Promise<EnsurePlatformAdminResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { ok: false, status: 500, message: error.message };
  }

  const user = data.user;
  if (!user) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  // Role can be stored in app_metadata or user_metadata depending on how claims were set
  const appMeta: any = user.app_metadata ?? {};
  const userMeta: any = user.user_metadata ?? {};
  const role = appMeta.role ?? userMeta.role;

  if (role !== "platform_admin") {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true, user };
}