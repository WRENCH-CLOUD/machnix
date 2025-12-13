"use client"

import { AppSidebar } from "@/components/common/app-sidebar"
import { TopHeader } from "@/components/common/top-header"
import { VehiclesView } from "@/components/features/vehicles/vehicles-view"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function VehiclesPage() {
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
      <AppSidebar activeView="vehicles" onViewChange={(view) => router.push(`/${view}`)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          tenantName="Mechanix Garage"
          onCreateJob={() => router.push("/jobs/create")}
        />
        <main className="flex-1 overflow-auto p-6">
          <VehiclesView />
        </main>
      </div>
    </div>
  )
}
