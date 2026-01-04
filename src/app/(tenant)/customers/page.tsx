"use client";

import { useState, useEffect } from "react";
import { CustomersView } from "@/components/tenant/customers/customers-view";
import { useAuth } from "@/providers/auth-provider";

interface CustomerWithStats {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalJobs: number;
  lastVisit: Date | null;
  vehicleCount: number;
  vehicles: Array<{ make: string | null; model: string | null }>;
}

export default function CustomersPage() {
  const { tenantId } = useAuth();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load if we have a tenantId
    if (tenantId) {
      loadCustomers();
    }
  }, [tenantId]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call API route - business logic is in the use case
      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const customersData = await response.json();

      // Transform for UI display with stats
      const customersWithStats: CustomerWithStats[] = customersData.map(
        (customer: any) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          totalJobs: customer.jobcards?.length || 0,
          lastVisit: customer.jobcards?.length > 0 
            ? new Date(customer.jobcards[0].created_at) 
            : null,
          vehicleCount: customer.vehicles?.length || 0,
          vehicles: (customer.vehicles || []).map((v: any) => ({
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
  };

  const handleAddCustomer = async () => {
    try {
      const response = await fetch("/api/customers/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "John Doe",
          phone: "1234567890",
          email: "john.doe@example.com",
          address: "123 Main St",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add customer");
      }

      console.log("Customer added successfully");
      await loadCustomers();
    } catch (err) {
      console.error("Error adding customer:", err);
      setError("Failed to add customer");
    }
  };

  return (
    <CustomersView
      customers={customers}
      loading={loading}
      error={error}
      onAddCustomer={handleAddCustomer}
      onRefresh={loadCustomers}
    />
  );
}
