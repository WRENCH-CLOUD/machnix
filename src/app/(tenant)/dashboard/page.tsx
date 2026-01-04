"use client"

import { TenantDashboard, type DashboardStats } from "@/components/tenant/views/tenant-dashboard-view"
import { useAuth } from "@/providers/auth-provider"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const { tenantId } = useAuth()
  const [stats, setStats] = useState<DashboardStats | undefined>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tenantId) {
      fetchStats()
    }
  }, [tenantId])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tenant/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return <TenantDashboard stats={stats} />
}
