"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/supabase/client";
import type { TenantWithStats } from "@/modules/tenant";
import type { CustomerOverview } from "@/modules/customer/domain/customer.entity";
import type { TenantSettings } from "@/modules/tenant/domain/tenant-settings.entity";

// ============================================
// Utility Functions
// ============================================

/**
 * Transforms tenant settings into the format expected by job details components
 */
export function transformTenantSettingsForJobDetails(tenantSettings: TenantSettings | undefined) {
  return {
    name: tenantSettings?.legalName || "Garage",
    address: tenantSettings?.address || "",
    gstin: tenantSettings?.gstNumber || "",
  };
}

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
  estimates: {
    all: ["estimates"] as const,
    byJob: (jobId: string) => [...queryKeys.estimates.all, "by-job", jobId] as const,
  },
  invoices: {
    all: ["invoices"] as const,
    byJob: (jobId: string) => [...queryKeys.invoices.all, "by-job", jobId] as const,
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
// Estimate Query
// Fetches estimate by job ID, creates one if not found
// ============================================

interface EstimateItem {
  id: string;
  custom_name: string;
  custom_part_number?: string;
  qty: number;
  unit_price: number;
  labor_cost?: number;
}

interface Estimate {
  id: string;
  estimate_number: string;
  status: string;
  parts_total?: number;
  labor_total?: number;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
  estimate_items?: EstimateItem[];
}

export function useEstimateByJob(
  jobId: string | undefined,
  jobData?: { jobNumber: string; customerId: string; vehicleId: string }
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.estimates.byJob(jobId || ""),
    queryFn: async (): Promise<Estimate | null> => {
      if (!jobId) return null;

      const res = await api.get(`/api/estimates/by-job/${jobId}`);
      if (res.ok) {
        return res.json();
      }

      // Create estimate if not found (legacy behavior)
      if (res.status === 404 && jobData) {
        const createRes = await api.post("/api/estimates/create", {
          jobcard_id: jobId,
          customer_id: jobData.customerId,
          vehicle_id: jobData.vehicleId,
          status: "draft",
          estimate_number: `EST-${jobData.jobNumber}`,
        });
        if (createRes.ok) {
          return createRes.json();
        }
      }

      return null;
    },
    enabled: Boolean(jobId),
    staleTime: 60_000,
  });
}

// ============================================
// Invoice Query
// ============================================

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: string;
  paid_amount: number;
  totalAmount?: number;
  total_amount?: number;
}

export function useInvoiceByJob(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invoices.byJob(jobId || ""),
    queryFn: async (): Promise<Invoice | null> => {
      if (!jobId) return null;

      const res = await api.get(`/api/invoices/by-job/${jobId}`);
      if (res.ok) {
        return res.json();
      }
      return null;
    },
    enabled: Boolean(jobId),
    staleTime: 60_000,
  });
}

// ============================================
// Estimate Item Mutations
// ============================================

export function useAddEstimateItem(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      estimateId,
      item,
    }: {
      estimateId: string;
      item: {
        name: string;
        partNumber?: string;
        quantity: number;
        unitPrice: number;
        laborCost?: number;
      };
    }) => {
      const res = await api.post(`/api/estimates/${estimateId}/items`, {
        custom_name: item.name,
        custom_part_number: item.partNumber,
        qty: item.quantity,
        unit_price: item.unitPrice,
        labor_cost: item.laborCost,
      });

      if (!res.ok) throw new Error("Failed to add item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.estimates.byJob(jobId) });
    },
  });
}

export function useRemoveEstimateItem(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.delete(`/api/estimates/items/${itemId}`);
      if (!res.ok) throw new Error("Failed to remove item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.estimates.byJob(jobId) });
    },
  });
}

export function useUpdateEstimateItem(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      updates,
    }: {
      itemId: string;
      updates: { qty?: number; unitPrice?: number; laborCost?: number };
    }) => {
      const res = await api.patch(`/api/estimates/items/${itemId}`, {
        qty: updates.qty,
        unitPrice: updates.unitPrice,
        laborCost: updates.laborCost,
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.estimates.byJob(jobId) });
    },
  });
}

// ============================================
// Invoice Mutations
// ============================================

export function useGenerateInvoice(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ estimateId }: { estimateId: string }) => {
      const res = await api.post("/api/invoices/generate", {
        jobcardId: jobId,
        estimateId,
      });
      if (!res.ok) throw new Error("Failed to generate invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byJob(jobId) });
    },
  });
}

export function useRecordPayment(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      amount,
      method,
    }: {
      invoiceId: string;
      amount: number;
      method: string;
    }) => {
      const res = await api.post(`/api/invoices/${invoiceId}/pay`, {
        amount,
        method,
      });
      if (!res.ok) throw new Error("Payment failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byJob(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

// ============================================
// Job Status Mutation
// ============================================

export function useUpdateJobStatus(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: string) => {
      const res = await api.post(`/api/jobs/${jobId}/update-status`, { status });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byJob(jobId) });
    },
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
    invalidateEstimates: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.estimates.all }),
    invalidateInvoices: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenant.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.estimates.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  };
}
