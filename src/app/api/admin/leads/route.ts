import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { ensurePlatformAdmin } from "@/lib/auth/is-platform-admin"

export async function GET() {
  try {
    // Authorization check - only platform admins can access leads
    const auth = await ensurePlatformAdmin()
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.message || "Unauthorized" },
        { status: auth.status || 401 }
      )
    }

    const supabase = getSupabaseAdmin()
    
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch leads:", error)
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }

    return NextResponse.json({ leads: leads || [] })
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
