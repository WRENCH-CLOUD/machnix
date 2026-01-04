"use client";

import { useState, useEffect } from "react";
import { VehiclesView, Vehicle } from "@/components/tenant/views/vehicles-view";
import { useAuth } from "@/providers/auth-provider";

export default function VehiclesPage() {
  const { tenantId } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      loadVehicles();
    }
  }, [tenantId]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/vehicles");
      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }

      const vehiclesData = await response.json();
      
      // Transform API data to UI format
      const transformedVehicles: Vehicle[] = vehiclesData.map((v: any) => ({
        id: v.id,
        makeName: v.make?.name || "Unknown",
        modelName: v.model || "Unknown",
        reg_no: v.reg_no,
        year: v.year,
        color: v.color,
        odometer: v.odometer,
        ownerName: v.customer?.name || "Unknown",
        totalJobs: v.jobs?.length || 0,
        lastService: v.jobs?.[0]?.created_at ? new Date(v.jobs[0].created_at) : undefined
      }));

      setVehicles(transformedVehicles);
    } catch (err) {
      console.error("Error loading vehicles:", err);
      setError("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (data: any) => {
    try {
      const response = await fetch("/api/vehicles/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to add vehicle");
      }

      await loadVehicles();
    } catch (err) {
      console.error("Error adding vehicle:", err);
      setError("Failed to add vehicle");
    }
  };

  return (
    <VehiclesView
      vehicles={vehicles}
      loading={loading}
      error={error}
      onAddVehicle={handleAddVehicle}
      onRetry={loadVehicles}
    />
  );
}
