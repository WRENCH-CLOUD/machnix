"use client"

import { type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "./components/admin-layout"
import { usePathname } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import Loader from "@/components/ui/loading"

export default function AdminLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, userRole, loading } = useAuth()

  // Client-side authorization guard
  useEffect(() => {
    if (!loading && user && userRole !== 'platform_admin') {
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
  if (user && userRole !== 'platform_admin') {
    return null
  }
  
  const getActiveView = () => {
    if (pathname.includes('/tenants')) return 'tenants'
    if (pathname.includes('/mechanics')) return 'mechanics'
    if (pathname.includes('/settings')) return 'settings'
    return 'overview'
  }

  const viewTitles: Record<string, string> = {
    overview: "Overview",
    tenants: "Tenants",
    mechanics: "Mechanics",
    settings: "Settings",
  }

  return (
    <AdminLayout
      activeView={getActiveView()}
      onViewChange={(view) => {
        const routes: Record<string, string> = {
          overview: '/admin',
          tenants: '/tenants',
          mechanics: '/mechanics',
          settings: '/settings',
        }
        window.location.href = routes[view]
      }}
      title={viewTitles[getActiveView()]}
    >
      {children}
    </AdminLayout>
  )
}
