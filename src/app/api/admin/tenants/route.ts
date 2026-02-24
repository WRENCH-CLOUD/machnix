import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { ensurePlatformAdmin } from "@/lib/auth/is-platform-admin"
import { GetAllTenantsWithStatsUseCase } from "@/modules/tenant"
import { AdminSupabaseTenantRepository } from "@/modules/tenant/infrastructure/tenant.repository.admin"

export async function GET() {
  try {
    const auth = await ensurePlatformAdmin()
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.message || "Forbidden" },
        { status: auth.status ?? 403 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const repo = new AdminSupabaseTenantRepository(supabaseAdmin)
    const usecase = new GetAllTenantsWithStatsUseCase(repo)

    const tenants = await usecase.execute()

    return NextResponse.json({ success: true, tenants })
  } catch (error) {
    console.error("[TENANT_LIST] Unexpected error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch tenants",
        details: "Please check server logs for more information",
      },
      { status: 500 }
    )
  }
}
