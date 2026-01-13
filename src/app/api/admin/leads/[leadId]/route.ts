import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { ensurePlatformAdmin } from "@/lib/auth/is-platform-admin"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    // Authorization check - only platform admins can update leads
    const auth = await ensurePlatformAdmin()
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.message || "Unauthorized" },
        { status: auth.status || 401 }
      )
    }

    const { leadId } = await params
    const body = await request.json()
    const { status, notes } = body

    const supabase = getSupabaseAdmin()
    
    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", leadId)
      .select()
      .single()

    if (error) {
      console.error("Failed to update lead:", error)
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
    }

    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error("Error updating lead:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    // Authorization check - only platform admins can delete leads
    const auth = await ensurePlatformAdmin()
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.message || "Unauthorized" },
        { status: auth.status || 401 }
      )
    }

    const { leadId } = await params
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadId)

    if (error) {
      console.error("Failed to delete lead:", error)
      return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting lead:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
