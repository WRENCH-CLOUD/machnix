"use client"

import { type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import Loader from "@/components/ui/loading"

export default function MechanicLayoutWrapper({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()

  // Client-side authorization guard
  useEffect(() => {
    if (!loading && user && userRole !== 'mechanic') {
      // Not authorized - redirect to no access
      router.push('/auth/no-access')
    }
  }, [user, userRole, loading, router])

  // Show loading while checking auth
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

  // Don't render if not authorized (middleware will handle no session case)
  if (user && userRole !== 'mechanic') {
    return null
  }

  return <>{children}</>
}
