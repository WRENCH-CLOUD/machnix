"use client";

import { useState, useEffect } from "react";
// TODO: update path of the missing function GlobalAnalytics i guess need to be created @sagun-py0909
import { GlobalAnalytics } from "@/modules/analytics";
import { TenantDetailsDialog } from "@/components/admin/tenant-details-dialog";
import { OverviewView } from "@/components/admin/overview-view";
import {
  type TenantWithStats,
  // GetAllTenantsWithStatsUseCase,
  // GetTenantWithStatsUseCase,
  // SupabaseTenantRepository 
} from "@/modules/tenant"

export default function AdminOverviewPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tenants, setTenants] = useState<TenantWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithStats | null>(
    null
  );
  const [tenantDetailsLoading, setTenantDetailsLoading] = useState(false);
  const [tenantDetailsError, setTenantDetailsError] = useState<string | null>(
    null
  );
  const [globalAnalytics, setGlobalAnalytics] =
    useState<GlobalAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    loadTenants();
    loadGlobalAnalytics();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[AdminPage] Starting to load tenants...");

      // Fetch tenants via admin API
      const response = await fetch('/api/admin/tenants');
      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }
      const { tenants } = await response.json();

      console.log("[AdminPage] Loaded tenants:", tenants.length);
      setTenants(tenants as TenantWithStats[]);
    } catch (err) {
      console.error("[AdminPage] Failed to load tenants:", err);
      setError("Failed to load tenants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch("/api/admin/analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const { analytics } = await response.json();
      setGlobalAnalytics(analytics);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleViewDetails = async (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setShowTenantDetails(true);
    setTenantDetailsLoading(true);
    setTenantDetailsError(null);

    try {
      // Fetch tenant details via admin API
      const response = await fetch(`/api/admin/tenants/${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tenant details');
      }
      const { tenant } = await response.json();
      setSelectedTenant(tenant as TenantWithStats);
    } catch (err) {
      console.error("Failed to load tenant details:", err);
      setTenantDetailsError("Failed to load tenant details");
    } finally {
      setTenantDetailsLoading(false);
    }
  };

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
  );
}
