"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CustomersView, CustomerWithStats, CustomerFormData } from "@/components/tenant/customers/customers-view";
import { useCustomers, useInvalidateQueries } from "@/hooks";

export default function CustomersPage() {
  const router = useRouter();
  const { data: customersData, isLoading, error } = useCustomers();
  const { invalidateCustomers } = useInvalidateQueries();

  // Transform API data to UI format
  const customers: CustomerWithStats[] = useMemo(() => {
    if (!customersData) return [];
    
    return customersData.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone ?? null,
      email: customer.email ?? null,
      address: customer.address ?? null,
      totalJobs: Array.isArray(customer.jobcards) ? customer.jobcards.length : 0,
      lastVisit: Array.isArray(customer.jobcards) && customer.jobcards.length > 0
        ? new Date(customer.jobcards[0].created_at)
        : null,
      vehicleCount: Array.isArray(customer.vehicles) ? customer.vehicles.length : 0,
      vehicles: (Array.isArray(customer.vehicles) ? customer.vehicles : []).map((v) => ({
        make: v.make ?? null,
        model: v.model ?? null,
      })),
    }));
  }, [customersData]);

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

    await invalidateCustomers();
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

    await invalidateCustomers();
  };

  const handleDeleteCustomer = async (id: string) => {
    const response = await fetch(`/api/customers/${id}/delete`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete customer");
    }

    await invalidateCustomers();
  };

  const handleCreateJob = (customer: CustomerWithStats) => {
    // Navigate to job creation with customer pre-selected
    router.push(`/jobs-board?customerId=${customer.id}`);
  };

  return (
    <CustomersView
      customers={customers}
      loading={isLoading}
      error={error?.message || null}
      onAddCustomer={handleAddCustomer}
      onEditCustomer={handleEditCustomer}
      onDeleteCustomer={handleDeleteCustomer}
      onRefresh={invalidateCustomers}
      onCreateJob={handleCreateJob}
    />
  );
}
