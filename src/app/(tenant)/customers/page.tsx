"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CustomersView, CustomerWithStats, CustomerFormData } from "@/components/tenant/customers/customers-view";
import { useAuth } from "@/providers/auth-provider";

export default function CustomersPage() {
  const router = useRouter();
  const { tenantId } = useAuth();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const customersData = await response.json();

      // Transform for UI display with stats
      const customersWithStats: CustomerWithStats[] = customersData.map(
        (customer: Record<string, unknown>) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          totalJobs: Array.isArray(customer.jobcards) ? customer.jobcards.length : 0,
          lastVisit: Array.isArray(customer.jobcards) && customer.jobcards.length > 0
            ? new Date((customer.jobcards[0] as Record<string, unknown>).created_at as string)
            : null,
          vehicleCount: Array.isArray(customer.vehicles) ? customer.vehicles.length : 0,
          vehicles: (Array.isArray(customer.vehicles) ? customer.vehicles : []).map((v: Record<string, unknown>) => ({
            make: v.make || null,
            model: v.model || null,
          })),
        })
      );

      setCustomers(customersWithStats);
    } catch (err) {
      console.error("Error loading customers:", err);
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tenantId) {
      loadCustomers();
    }
  }, [tenantId, loadCustomers]);

  const handleAddCustomer = async (data: CustomerFormData) => {
    // Build request body - only include non-empty values
    const requestBody: Record<string, string> = {
      name: data.name,
    };
    if (data.phone?.trim()) requestBody.phone = data.phone.trim();
    if (data.email?.trim()) requestBody.email = data.email.trim();
    if (data.address?.trim()) requestBody.address = data.address.trim();

    const response = await fetch("/api/customers/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });


    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add customer");
    }

    await loadCustomers();
  };

  const handleEditCustomer = async (id: string, data: CustomerFormData & { notes: string }) => {
    const response = await fetch(`/api/customers/${id}/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update customer");
    }

    await loadCustomers();
  };

  const handleDeleteCustomer = async (id: string) => {
    const response = await fetch(`/api/customers/${id}/delete`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete customer");
    }

    await loadCustomers();
  };

  const handleCreateJob = (customer: CustomerWithStats) => {
    // Navigate to job creation with customer pre-selected
    router.push(`/jobs-board?customerId=${customer.id}`);
  };

  return (
    <CustomersView
      customers={customers}
      loading={loading}
      error={error}
      onAddCustomer={handleAddCustomer}
      onEditCustomer={handleEditCustomer}
      onDeleteCustomer={handleDeleteCustomer}
      onRefresh={loadCustomers}
      onCreateJob={handleCreateJob}
    />
  );
}
