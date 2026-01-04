"use client"

import "reflect-metadata"
import { type ReactNode, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import Loader from "@/components/ui/loading"
import { AppSidebar } from "@/components/common/app-sidebar"
import { TopHeader } from "@/components/common/top-header"

export default function TenantLayoutWrapper({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, tenantId, loading } = useAuth()
  const [tenantName, setTenantName] = useState<string>("Loading...")

  // Fetch tenant name when tenantId is available
  useEffect(() => {
    if (tenantId) {
      fetch('/api/tenant/stats')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.name) {
            setTenantName(data.name)
          }
        })
        .catch(err => {
          console.error('[TenantLayout] Failed to fetch tenant name:', err)
        })
    }
  }, [tenantId])
  
  useEffect(() => {
    console.log("[TenantLayout] Client-side Auth State:", { user: !!user, tenantId, loading, pathname })
  }, [user, tenantId, loading, pathname])

  // Extract active view from pathname (e.g., /dashboard -> dashboard)
  const segments = pathname.split('/').filter(Boolean)
  const activeView = segments[0] || "dashboard"

  useEffect(() => {
    if (loading) return

    // Special case for root / - if logged in, go to dashboard
    if (pathname === "/" && user && tenantId) {
      router.replace("/dashboard")
      return
    }

    // Not logged in
    if (!user) {
      console.log("[TenantLayout] No user found, redirecting to login...")
      router.replace("/login")
      return
    }

    // Logged in but not a tenant
    if (!tenantId) {
      console.log("[TenantLayout] No tenantId found, redirecting to no-access...")
      router.replace("/auth/no-access")
      return
    }
  }, [user, tenantId, loading, router, pathname])

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white">
        <Loader
          title="Verifying access..."
          subtitle="Please wait"
          size="lg"
        />
        <div className="mt-4 text-sm font-medium animate-pulse">
          Verifying session...
        </div>
      </div>
    )
  }

  // If not loading and no user/tenantId, we should be redirecting.
  // We'll show a brief redirecting state instead of the diagnostic UI
  if (!user || !tenantId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Redirecting...</h2>
          <p className="text-slate-400">Verifying your permissions</p>
          <div className="mt-8">
            <button 
              onClick={() => router.replace("/login")}
              className="px-4 py-2 bg-transparent border border-white/20 hover:bg-white/10 text-white rounded-md"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar 
        activeView={activeView} 
        onViewChange={(view) => router.push(`/${view}`)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          tenantName={tenantName}
          onCreateJob={() => {
            if (pathname === "/jobs-board") {
              // Dispatch a custom event that JobsPage can listen to
              window.dispatchEvent(new CustomEvent('open-create-job'));
            } else {
              router.push("/jobs-board?create=true");
            }
          }}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
