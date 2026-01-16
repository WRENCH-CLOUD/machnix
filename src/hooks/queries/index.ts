"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/supabase/client";
import type { TenantWithStats } from "@/modules/tenant";
import type { CustomerOverview } from "@/modules/customer/domain/customer.entity";
import type { TenantSettings } from "@/modules/tenant/domain/tenant-settings.entity";

// ============================================
// Query Keys - centralized for cache management
// ============================================

export const queryKeys = {
  tenant: {
    all: ["tenant"] as const,
    dashboard: () => [...queryKeys.tenant.all, "dashboard"] as const,
    settings: () => [...queryKeys.tenant.all, "settings"] as const,
  },
  jobs: {
    all: ["jobs"] as const,
    list: (tenantId: string) => [...queryKeys.jobs.all, "list", tenantId] as const,
  },
  customers: {
    all: ["customers"] as const,
    list: () => [...queryKeys.customers.all, "list"] as const,
  },
  vehicles: {
    all: ["vehicles"] as const,
    list: () => [...queryKeys.vehicles.all, "list"] as const,
  },
  vehicleMakes: {
    all: ["vehicle-makes"] as const,
    list: () => [...queryKeys.vehicleMakes.all, "list"] as const,
  },
} as const;

// ============================================
// Tenant Dashboard Query
// Uses TenantWithStats from @/modules/tenant domain
// ============================================

export function useTenantDashboard() {
  return useQuery({
    queryKey: queryKeys.tenant.dashboard(),
    queryFn: async (): Promise<TenantWithStats> => {
      const res = await fetch("/api/tenant/stats");
      if (!res.ok) {
        throw new Error("Failed to fetch tenant dashboard");
      }
      return res.json();
    },
    staleTime: 60_000, // 60 seconds
  });
}

// ============================================
// Tenant Settings Query
// Tenant settings rarely change during a session, so we cache them
// ============================================

export function useTenantSettings() {
  return useQuery({
    queryKey: queryKeys.tenant.settings(),
    queryFn: async (): Promise<TenantSettings> => {
      const res = await api.get("/api/tenant/settings");
      if (!res.ok) {
        throw new Error("Failed to fetch tenant settings");
      }
      return res.json();
    },
    staleTime: 5 * 60_000, // 5 minutes - settings rarely change
  });
}

// ============================================
// Jobs Query
// ============================================

export function useJobs(tenantId: string | null) {
  return useQuery({
    queryKey: queryKeys.jobs.list(tenantId || ""),
    queryFn: async () => {
      const res = await api.get("/api/jobs", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return res.json();
    },
    enabled: Boolean(tenantId),
    staleTime: 60_000,
  });
}

// ============================================
// Customers Query
// Uses CustomerOverview from domain
// ============================================

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers.list(),
    queryFn: async (): Promise<CustomerOverview[]> => {
      const res = await fetch("/api/customers");
      if (!res.ok) {
        throw new Error("Failed to fetch customers");
      }
      return res.json();
    },
    staleTime: 60_000,
  });
}

// ============================================
// Vehicles Query
// ============================================

export function useVehicles() {
  return useQuery({
    queryKey: queryKeys.vehicles.list(),
    queryFn: async () => {
      const res = await fetch("/api/vehicles");
      if (!res.ok) {
        throw new Error("Failed to fetch vehicles");
      }
      return res.json();
    },
    staleTime: 60_000,
  });
}

// ============================================
// Vehicle Makes Query
// ============================================

export function useVehicleMakes() {
  return useQuery({
    queryKey: queryKeys.vehicleMakes.list(),
    queryFn: async (): Promise<Array<{ id: string; name: string }>> => {
      const res = await fetch("/api/vehicle-makes");
      if (!res.ok) {
        throw new Error("Failed to fetch vehicle makes");
      }
      return res.json();
    },
    staleTime: 5 * 60_000, // 5 minutes - makes rarely change
  });
}

// ============================================
// Invalidation Helpers
// ============================================

export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateDashboard: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tenant.dashboard() }),
    invalidateTenantSettings: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tenant.settings() }),
    invalidateJobs: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
    invalidateCustomers: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
    invalidateVehicles: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenant.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  };
}
