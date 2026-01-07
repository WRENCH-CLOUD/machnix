import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

// Helper to verify platform admin
async function verifyPlatformAdmin() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { authorized: false, error: "Not authenticated" }
  }

  // Check if user is platform admin
  const role = user.app_metadata?.role
  if (role !== "platform_admin") {
    return { authorized: false, error: "Not authorized" }
  }

  return { authorized: true, user }
}

// GET /api/admin/callbacks - List all callback requests
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyPlatformAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
      .from("callback_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch callbacks:", error)
      return NextResponse.json(
        { error: "Failed to fetch callback requests" },
        { status: 500 }
      )
    }

    return NextResponse.json({ callbacks: data })
  } catch (error) {
    console.error("Admin callbacks error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
