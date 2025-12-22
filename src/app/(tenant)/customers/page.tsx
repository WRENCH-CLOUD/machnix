"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/common/app-sidebar";
import { TopHeader } from "@/components/common/top-header";
import { CustomersView } from "@/components/tenant/customers/customers-view";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { CreateCustomerUseCase } from "@/modules/customer/application/create-customer.use-case";
import { SupabaseCustomerRepository } from "@/modules/customer/infrastructure/customer.repository.supabase";

interface CustomerWithStats {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  vehicleCount: number;
  vehicles: any[];
}

export default function CustomersPage() {
  const { user, loading: authLoading, tenantId } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
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

      // Simple transform for UI display
      const customersWithStats: CustomerWithStats[] = customersData.map(
        (customer: any) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          vehicleCount: customer.vehicles?.length || 0,
          vehicles: customer.vehicles || [],
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

  const handleAddCustomer = () => {
    const createCustomerUseCase = new CreateCustomerUseCase(
      new SupabaseCustomerRepository()
    );
    createCustomerUseCase.execute(
      // TODO: change to dynamic input data
      {
        name: "John Doe",
        phone: "1234567890",
        email: "john.doe@example.com",
        address: "123 Main St",
      },
      tenantId
    );
    console.log("Add customer");
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        activeView="customers"
        onViewChange={(view) => router.push(`/${view}`)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          tenantName="Mechanix Garage"
          onCreateJob={() => router.push("/jobs/create")}
        />
        <main className="flex-1 overflow-auto p-6">
          <CustomersView
            customers={customers}
            loading={loading}
            error={error}
            onAddCustomer={handleAddCustomer}
            onRefresh={loadCustomers}
          />
        </main>
      </div>
    </div>
  );
}
