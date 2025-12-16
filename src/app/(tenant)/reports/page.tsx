"use client"

import { AppSidebar } from "@/components/common/app-sidebar"
import { TopHeader } from "@/components/common/top-header"
import { ReportsView } from "legacy/Legacy-ui(needed-to-migrate)/reports/reports-view"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ReportsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activeView="reports" onViewChange={(view) => router.push(`/${view}`)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          tenantName="Mechanix Garage"
          onCreateJob={() => router.push("/jobs/create")}
        />
        <main className="flex-1 overflow-auto p-6">
          <ReportsView />
        </main>
      </div>
    </div>
  )
}
