"use client"

import "reflect-metadata"
import { type ReactNode, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { useTenantDashboard } from "@/hooks"
import { useOnboardingStatus } from "@/hooks/use-onboarding"
import Loader from "@/components/ui/loading"
import { AppSidebar } from "@/components/common/app-sidebar"
import { TopHeader } from "@/components/common/top-header"
import { SidebarProvider } from "@/components/ui/sidebar"

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

  // Use shared dashboard query for tenant name (cached, no duplicate fetch)
  const { data: dashboardData } = useTenantDashboard()
  const tenantName = dashboardData?.name || "Loading..."

  // Fetch onboarding status
  const {
    data: onboardingData,
    isLoading: onboardingLoading,
    error: onboardingError,
    refetch: refetchOnboarding,
  } = useOnboardingStatus()

  useEffect(() => {
    console.log("[TenantLayout] Client-side Auth State:", { user: !!user, tenantId, loading, pathname })
  }, [user, tenantId, loading, pathname])

  const isOnboardingPage = pathname === "/onboarding"

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

  useEffect(() => {
    if (loading || onboardingLoading) return

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

    // Onboarding gating (uses tenant.is_onboarded)
    if (onboardingData && !onboardingData.isOnboarded && !isOnboardingPage) {
      router.replace("/onboarding")
      return
    }

    if (onboardingData && onboardingData.isOnboarded && isOnboardingPage) {
      router.replace("/dashboard")
      return
    }
  }, [user, tenantId, loading, onboardingLoading, onboardingData, router, pathname, isOnboardingPage])

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

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Loader
          title="Redirecting..."
          subtitle="Taking you to login"
          size="lg"
        />
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Loader
          title="Redirecting..."
          subtitle="Verifying your permissions"
          size="lg"
        />
      </div>
    )
  }

  if (onboardingError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Couldn't verify onboarding</h2>
          <p className="text-muted-foreground text-sm">
            Please retry. If this persists, check your session.
          </p>
        </div>
        <button
          onClick={() => refetchOnboarding()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Retry
        </button>
      </div>
    )
  }

  // While redirecting due to onboarding rules, show a stable loader
  if (onboardingData && !onboardingData.isOnboarded && !isOnboardingPage) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Loader
          title="Setting up your experience..."
          subtitle="Redirecting to onboarding"
          size="lg"
        />
      </div>
    )
  }

  if (onboardingData && onboardingData.isOnboarded && isOnboardingPage) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Loader
          title="Redirecting..."
          subtitle="Taking you to dashboard"
          size="lg"
        />
      </div>
    )
  }

  // If on onboarding page, render without sidebar layout
  if (isOnboardingPage) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <SidebarProvider>
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
