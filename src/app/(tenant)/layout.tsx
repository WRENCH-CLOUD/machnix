"use client"

import { type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import Loader from "@/components/ui/loading"

export default function TenantLayoutWrapper({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const { user, tenantId, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    // Not logged in
    if (!user) {
      router.replace("/login")
      return
    }

    // Logged in but not a tenant
    if (!tenantId) {
      router.replace("/auth/no-access")
      return
    }
  }, [user, tenantId, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader
          title="Verifying access..."
          subtitle="Please wait"
          size="lg"
        />
      </div>
    )
  }

  // Hard stop
  if (!user || !tenantId) {
    return null
  }

  return <>{children}</>
}
