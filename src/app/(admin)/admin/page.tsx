"use client"

import { useState, useEffect } from "react"
import { type GlobalAnalytics } from "@/app/modules/analytics.service"
import { TenantDetailsDialog } from "@/app/(admin)/components/tenant-details-dialog"
import { OverviewView } from "@/app/(admin)/components/overview-view"
import { 
  type TenantWithStats,
  GetAllTenantsWithStatsUseCase,
  GetTenantWithStatsUseCase,
  SupabaseTenantRepository 
} from "@/modules/tenant"

export default function AdminOverviewPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [tenants, setTenants] = useState<TenantWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [showTenantDetails, setShowTenantDetails] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantWithStats | null>(null)
  const [tenantDetailsLoading, setTenantDetailsLoading] = useState(false)
  const [tenantDetailsError, setTenantDetailsError] = useState<string | null>(null)
  const [globalAnalytics, setGlobalAnalytics] = useState<GlobalAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    loadTenants()
    loadGlobalAnalytics()
  }, [])

  const loadTenants = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('[AdminPage] Starting to load tenants...')
      
      // Use the module's use case
      const repository = new SupabaseTenantRepository()
      const useCase = new GetAllTenantsWithStatsUseCase(repository)
      const data = await useCase.execute()
      
      console.log('[AdminPage] Loaded tenants:', data.length)
      setTenants(data)
    } catch (err) {
      console.error('[AdminPage] Failed to load tenants:', err)
      setError('Failed to load tenants. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadGlobalAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      const response = await fetch('/api/admin/analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const { analytics } = await response.json()
      setGlobalAnalytics(analytics)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const handleViewDetails = async (tenantId: string) => {
    setSelectedTenantId(tenantId)
    setShowTenantDetails(true)
    setTenantDetailsLoading(true)
    setTenantDetailsError(null)

    try {
      const repository = new SupabaseTenantRepository()
      const useCase = new GetTenantWithStatsUseCase(repository)
      const data = await useCase.execute(tenantId)
      setSelectedTenant(data)
    } catch (err) {
      console.error('Failed to load tenant details:', err)
      setTenantDetailsError('Failed to load tenant details')
    } finally {
      setTenantDetailsLoading(false)
    }
  }

  return (
    <>
      <OverviewView
        tenants={tenants}
        loading={loading}
        error={error}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={loadTenants}
        onViewDetails={handleViewDetails}
        globalAnalytics={globalAnalytics}
        analyticsLoading={analyticsLoading}
      />

      <TenantDetailsDialog
        tenant={selectedTenant}
        loading={tenantDetailsLoading}
        error={tenantDetailsError}
        open={showTenantDetails}
        onOpenChange={setShowTenantDetails}
      />
    </>
  )
}
