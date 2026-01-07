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
    return { authorized: false, error: "Not authenticated", user: null }
  }

  // Check if user is platform admin
  const role = user.app_metadata?.role
  if (role !== "platform_admin") {
    return { authorized: false, error: "Not authorized", user: null }
  }

  return { authorized: true, user }
}

type RouteContext = {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/callbacks/[id] - Update callback request
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await verifyPlatformAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status, notes } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.status = status
      if (status === "contacted" && auth.user?.id) {
        updateData.contacted_at = new Date().toISOString()
        
        // Look up platform_admin ID from auth_user_id
        const { data: platformAdmin } = await supabase
          .from("platform_admins")
          .select("id")
          .eq("auth_user_id", auth.user.id)
          .single()
        
        if (platformAdmin?.id) {
          updateData.contacted_by = platformAdmin.id
        }
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { data, error } = await supabase
      .from("callback_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Failed to update callback:", error)
      return NextResponse.json(
        { error: "Failed to update callback request" },
        { status: 500 }
      )
    }

    return NextResponse.json({ callback: data })
  } catch (error) {
    console.error("Update callback error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/callbacks/[id] - Delete callback request
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await verifyPlatformAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { id } = await context.params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from("callback_requests")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Failed to delete callback:", error)
      return NextResponse.json(
        { error: "Failed to delete callback request" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete callback error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
