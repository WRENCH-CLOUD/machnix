"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import Loader from "@/components/ui/loading"

export default function HomePage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user && userRole) {
        // Redirect authenticated users to appropriate dashboard
        if (userRole === "platform_admin") {
          router.push("/admin")
        } else if (userRole === "mechanic") {
          router.push("/mechanic")
        } else if (userRole === "no_access") {
          router.push("/auth/no-access")
        } else {
          router.push("/dashboard")
        }
      } else {
        // Redirect unauthenticated users to login
        router.push("/login")
      }
    }
  }, [user, userRole, loading, router])

  // Show loading state while checking auth and redirecting
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader 
        title="Loading..."
        subtitle="Please wait"
        size="lg"
      />
    </div>
  )
}
