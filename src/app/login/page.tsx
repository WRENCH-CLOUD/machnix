"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginPage } from "@/components/features/auth/login-page"
import { useAuth } from "@/providers/auth-provider"
import Loader from "@/components/ui/loading"

export default function Login() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If already logged in, redirect to appropriate dashboard
    if (!loading && user && userRole) {
      if (userRole === "platform_admin") {
        router.push("/admin")
      } else if (userRole === "mechanic") {
        router.push("/mechanic")
      } else if (userRole === "no_access") {
        router.push("/auth/no-access")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, userRole, loading, router])

  // Show loading while checking auth
  if (loading) {
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

  // If already authenticated, show loading while redirecting
  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader 
          title="Redirecting..."
          subtitle="Taking you to your dashboard"
          size="lg"
        />
      </div>
    )
  }

  return <LoginPage />
}
