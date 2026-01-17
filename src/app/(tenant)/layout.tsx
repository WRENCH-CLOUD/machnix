"use client"

import "reflect-metadata"
import { type ReactNode, useEffect, useCallback, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { useTenantDashboard } from "@/hooks"
import { useOnboardingStatus } from "@/hooks/use-onboarding"
import Loader from "@/components/ui/loading"
import { AppSidebar } from "@/components/common/app-sidebar"
import { TopHeader } from "@/components/common/top-header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { OnboardingModal } from "@/components/tenant/onboarding-modal"

// Inner layout component that uses sidebar context
function TenantLayoutContent({
  children,
  tenantName,
  activeView,
  onViewChange,
  onCreateJob,
}: {
  children: ReactNode
  tenantName: string
  activeView: string
  onViewChange: (view: string) => void
  onCreateJob: () => void
}) {
  return (
    <>
      <AppSidebar 
        activeView={activeView} 
        onViewChange={onViewChange} 
      />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <TopHeader
          tenantName={tenantName}
          onCreateJob={onCreateJob}
        />
        <main className="flex-1 overflow-auto p-3 md:p-4 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </>
  )
}

export default function TenantLayoutWrapper({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, tenantId, loading } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  // Use shared dashboard query for tenant name (cached, no duplicate fetch)
  const { data: dashboardData } = useTenantDashboard()
  const tenantName = dashboardData?.name || "Loading..."
  
  // Fetch onboarding status
  const { data: onboardingData, isLoading: onboardingLoading, refetch: refetchOnboarding } = useOnboardingStatus()
  
  useEffect(() => {
    console.log("[TenantLayout] Client-side Auth State:", { user: !!user, tenantId, loading, pathname })
  }, [user, tenantId, loading, pathname])

  // Check onboarding status and show modal if needed
  useEffect(() => {
    if (onboardingData && !onboardingData.isOnboarded) {
      setShowOnboarding(true)
    }
  }, [onboardingData])

  // Extract active view from pathname (e.g., /dashboard -> dashboard)
  const segments = pathname.split('/').filter(Boolean)
  const activeView = segments[0] || "dashboard"

  const handleViewChange = useCallback((view: string) => {
    router.push(`/${view}`)
  }, [router])

  const handleCreateJob = useCallback(() => {
    if (pathname === "/jobs-board") {
      // Dispatch a custom event that JobsPage can listen to
      window.dispatchEvent(new CustomEvent('open-create-job'))
    } else {
      router.push("/jobs-board?create=true")
    }
  }, [pathname, router])

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false)
    refetchOnboarding()
  }, [refetchOnboarding])

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

  if (loading || onboardingLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
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
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Redirecting...</h2>
          <p className="text-muted-foreground">Verifying your permissions</p>
          <div className="mt-8">
            <button 
              onClick={() => router.replace("/login")}
              className="px-4 py-2 bg-transparent border border-white/30 hover:bg-white/10 text-white rounded-md"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      {/* Onboarding Modal - shown if user hasn't completed onboarding */}
      {showOnboarding && (
        <OnboardingModal 
          initialData={onboardingData}
          onComplete={handleOnboardingComplete}
        />
      )}
      
      <TenantLayoutContent
        tenantName={tenantName}
        activeView={activeView}
        onViewChange={handleViewChange}
        onCreateJob={handleCreateJob}
      >
        {children}
      </TenantLayoutContent>
    </SidebarProvider>
  )
}

