"use client"

import { TenantDashboard, type DashboardStats } from "@/components/tenant/views/tenant-dashboard-view"
import { useTenantDashboard } from "@/hooks"
import Loader from "@/components/ui/loading"

export default function DashboardPage() {
  const { data, isLoading } = useTenantDashboard()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader title="Loading dashboard..." size="lg" />
      </div>
    )
  }

  return <TenantDashboard stats={data} />
}
