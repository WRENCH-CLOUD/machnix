"use client"

import { LoginPage } from "@/components/mechanix/login-page"
import { AdminDashboard } from "@/components/mechanix/admin-dashboard"
import { MechanicDashboard } from "@/components/mechanix/mechanic-dashboard"
import { TenantDashboard } from "@/components/mechanix/tenant-dashboard"
import { useAuth } from "@/lib/auth-provider"
import { Skeleton } from "@/components/ui/skeleton"

function AppContent() {
  const { user, userRole, loading: authLoading, session } = useAuth()

  console.log('[PAGE] 🎬 Render - State:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    hasSession: !!session, 
    userRole, 
    authLoading 
  })

  // Show loading state while auth is initializing
  if (authLoading) {
    console.log('[PAGE] ⏳ Showing loading state (auth initializing)')
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!session || !user) {
    console.log('[PAGE] 🔐 No session/user - showing LoginPage')
    return <LoginPage />
  }

  // Show loading if user role is still being determined
  if (!userRole && !authLoading) {
    console.log('[PAGE] ⏳ User role is null - showing loading...')
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    )
  }

  console.log('[PAGE] 🎯 User role:', userRole)

  // Role-based routing
  if (userRole === "platform_admin") {
    console.log('[PAGE] ✅ Routing to AdminDashboard (platform_admin)')
    return <AdminDashboard />
  }

  if (userRole === "mechanic") {
    console.log('[PAGE] ✅ Routing to MechanicDashboard')
    return <MechanicDashboard />
  }

  if (userRole === "tenant") {
    console.log('[PAGE] ✅ Routing to TenantDashboard')
    return <TenantDashboard />
  }

  if (userRole === "no_access") {
    console.log('[PAGE] ❌ User has no_access role')
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-8">
          <h1 className="text-2xl font-bold text-destructive">No Access</h1>
          <p className="text-muted-foreground">
            You do not have access to this system. Please contact an administrator.
          </p>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            className="text-primary hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // Fallback for unknown roles
  console.log('[PAGE] ⚠️ Unknown role, showing fallback error:', userRole)
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md p-8">
        <h1 className="text-2xl font-bold text-destructive">Unknown Role</h1>
        <p className="text-muted-foreground">
          Your account has an unrecognized role: {userRole}
        </p>
        <button
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
          className="text-primary hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function MechanixApp() {
  return <AppContent />
}
