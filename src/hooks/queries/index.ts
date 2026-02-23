"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/supabase/client";
import type { TenantWithStats } from "@/modules/tenant";
import type { CustomerOverview } from "@/modules/customer/domain/customer.entity";
import type { TenantSettings } from "@/modules/tenant/domain/tenant-settings.entity";
import type { InventoryItem } from "@/modules/inventory/domain/inventory.entity";

// ============================================
// Utility Functions
// ============================================

/**
 * Transforms tenant settings into the format expected by job details components
 */
export function transformTenantSettingsForJobDetails(tenantSettings: TenantSettings | undefined) {
  // Use the response from /api/tenant/settings which includes:
  // - name: from tenant.tenants table (the garage name)
  // - all settings fields from tenant.settings
  const settings = tenantSettings as TenantSettings & { name?: string } | undefined;
  return {
    name: settings?.name || settings?.legalName || "Garage",
    address: [settings?.address, settings?.city, settings?.state, settings?.pincode]
      .filter(Boolean)
      .join(", ") || "",
    gstin: settings?.gstNumber || "",
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
    detail: (jobId: string) => [...queryKeys.jobs.all, "detail", jobId] as const,
  },
  customers: {
    all: ["customers"] as const,
    list: () => [...queryKeys.customers.all, "list"] as const,
  },
  vehicles: {
    all: ["vehicles"] as const,
    list: () => [...queryKeys.vehicles.all, "list"] as const,
    jobHistory: (vehicleId: string) => [...queryKeys.vehicles.all, "job-history", vehicleId] as const,
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
  transactions: {
    all: ["transactions"] as const,
    list: () => [...queryKeys.transactions.all, "list"] as const,
  },
  inventory: {
    all: ["inventory"] as const,
    list: () => [...queryKeys.inventory.all, "list"] as const,
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
      const res = await api.get("/api/jobs");
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
// Vehicle Job History Query
// ============================================

interface VehicleJobHistory {
  totalJobs: number;
  recentJob: {
    id: string;
    jobNumber: string;
    createdAt: string;
    status: string;
    partsWorkedOn: Array<{
      name: string;
      status: 'changed' | 'repaired';
    }>;
  } | null;
}

export function useVehicleJobHistory(vehicleId: string | undefined, currentJobId?: string) {
  return useQuery({
    queryKey: [...queryKeys.vehicles.jobHistory(vehicleId || ""), currentJobId],
    queryFn: async (): Promise<VehicleJobHistory> => {
      if (!vehicleId) {
        return { totalJobs: 0, recentJob: null };
      }
      const url = currentJobId
        ? `/api/vehicles/${vehicleId}/job-history?currentJobId=${currentJobId}`
        : `/api/vehicles/${vehicleId}/job-history`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch vehicle job history");
      }
      return res.json();
    },
    enabled: Boolean(vehicleId),
    staleTime: 60_000,
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
  invoiceNumber: string;
  invoiceDate: string | Date;
  status: string;
  paidAmount: number;
  totalAmount?: number;
  taxAmount?: number;
  subtotal?: number;
  discountAmount?: number;
  discountPercentage?: number;
  isGstBilled?: boolean;
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

export interface InsufficientStockErrorData {
  code: 'INSUFFICIENT_STOCK';
  requested: number;
  available: number;
  message: string;
}

export class StockError extends Error {
  code: string;
  requested: number;
  available: number;

  constructor(data: InsufficientStockErrorData) {
    super(data.message);
    this.name = 'StockError';
    this.code = data.code;
    this.requested = data.requested;
    this.available = data.available;
  }
}

export function useAddEstimateItem(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      estimateId,
      item,
    }: {
      estimateId: string;
      item: {
        partId?: string; // Inventory Item ID
        name: string;
        partNumber?: string;
        quantity: number;
        unitPrice: number;
        laborCost?: number;
      };
    }) => {
      const res = await api.post(`/api/estimates/${estimateId}/items`, {
        part_id: item.partId,
        custom_name: item.name,
        custom_part_number: item.partNumber,
        qty: item.quantity,
        unit_price: item.unitPrice,
        labor_cost: item.laborCost,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to add item' }));
        if (errorData.code === 'INSUFFICIENT_STOCK') {
          throw new StockError({
            code: errorData.code,
            requested: errorData.requested,
            available: errorData.available,
            message: errorData.error,
          });
        }
        throw new Error(errorData.error || 'Failed to add item');
      }
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
      // Reverse sync: task's showInEstimate may have changed, refresh tasks
      queryClient.invalidateQueries({ queryKey: ["tasks", "job", jobId] });
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
        unit_price: updates.unitPrice,
        labor_cost: updates.laborCost,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update item' }));
        if (errorData.code === 'INSUFFICIENT_STOCK') {
          throw new StockError({
            code: errorData.code,
            requested: errorData.requested,
            available: errorData.available,
            message: errorData.error,
          });
        }
        throw new Error(errorData.error || 'Failed to update item');
      }
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
    mutationFn: async ({
      estimateId,
      isGstBilled = true,
      discountPercentage = 0,
    }: {
      estimateId: string;
      isGstBilled?: boolean;
      discountPercentage?: number;
    }) => {
      const res = await api.post("/api/invoices/generate", {
        estimateId,
        isGstBilled,
        discountPercentage,
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

/**
 * Mutation to update invoice GST/discount settings
 * Used for real-time toggle updates
 */
export function useUpdateInvoice(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      isGstBilled,
      discountPercentage,
    }: {
      invoiceId: string;
      isGstBilled?: boolean;
      discountPercentage?: number;
    }) => {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isGstBilled, discountPercentage }),
      });
      if (!res.ok) throw new Error("Failed to update invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byJob(jobId) });
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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const error = new Error(errorData.error || "Failed to update status");
        (error as any).status = res.status;
        (error as any).paymentRequired = errorData.paymentRequired;
        (error as any).balance = errorData.balance;
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byJob(jobId) });
    },
  });
}


// ============================================
// Job Notes Mutation
// ============================================

export function useUpdateJobNotes(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notes: string) => {
      const res = await api.patch(`/api/jobs/${jobId}/notes`, { notes });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Notes update failed:", res.status, errorData);
        const message =
          (errorData && (errorData.error || errorData.message || errorData.detail)) ||
          `Failed to update notes (status ${res.status})`;
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
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

// ============================================
// Transactions Query
// ============================================

export interface Transaction {
  id: string;
  amount: number;
  mode: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  invoice: { id: string; invoiceNumber: string } | null;
  customer: { id: string; name: string; phone: string } | null;
  vehicle: { id: string; regNo: string; make: string; model: string } | null;
  jobcard: { id: string; jobNumber: string } | null;
}

export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions.list(),
    queryFn: async (): Promise<Transaction[]> => {
      const res = await fetch("/api/transactions");
      if (!res.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return res.json();
    },
  });
}

// ============================================
// Inventory Query
// ============================================

/**
 * @deprecated Use `useInventorySnapshot` from '@/hooks/use-inventory-snapshot' instead.
 * 
 * The new hook provides:
 * - Delta sync (only fetches changes, not full list)
 * - O(1) item lookups by ID
 * - Client-side search
 * - Session-long caching
 * 
 * This legacy hook fetches all items on every mount and is less efficient.
 */
export function useInventoryItems() {
  return useQuery({
    queryKey: queryKeys.inventory.list(),
    queryFn: async () => {
      const res = await api.get("/api/inventory/items");
      if (!res.ok) throw new Error("Failed to fetch inventory items");
      return res.json() as Promise<InventoryItem[]>;
    },
    // Increase stale time to reduce refetches while migrating
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

