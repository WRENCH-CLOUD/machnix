"use client"

import { MechanicDashboard } from "legacy/Legacy-ui(needed-to-migrate)/mechanic/mechanic-dashboard"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function MechanicPage() {
  const { user, loading, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
    if (!loading && userRole !== "mechanic") {
      router.push("/dashboard")
    }
  }, [user, loading, userRole, router])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return <MechanicDashboard />
}
