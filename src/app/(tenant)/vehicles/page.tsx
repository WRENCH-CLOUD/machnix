"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { VehiclesView } from "@/components/tenant/views/vehicles-view";
import { useAuth } from "@/providers/auth-provider";
import { VehicleViewModel, VehicleFormData, transformVehicleToViewModel } from "@/lib/transformers";

interface VehicleEditFormData {
  make: string;
  model: string;
  regNo: string;
  year: string;
  color: string;
  odometer: string;
}

export default function VehiclesPage() {
  const router = useRouter();
  const { tenantId } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleViewModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [makes, setMakes] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/vehicles");
      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }

      const vehiclesData = await response.json();
      
      // Transform API data to UI format
      const transformedVehicles: VehicleViewModel[] = vehiclesData.map(transformVehicleToViewModel);

      setVehicles(transformedVehicles);
    } catch (err) {
      console.error("Error loading vehicles:", err);
      setError("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMakes = useCallback(async () => {
    try {
      const response = await fetch("/api/vehicle-makes");
      if (response.ok) {
        const makesData = await response.json();
        setMakes(makesData);
      }
    } catch (err) {
      console.error("Error loading makes:", err);
      // Non-blocking error - makes are optional
    }
  }, []);

  const loadModels = useCallback(async (makeId: string) => {
    if (!makeId) {
      setModels([]);
      return;
    }
    try {
      const response = await fetch(`/api/vehicle-models?makeId=${makeId}`);
      if (response.ok) {
        const modelsData = await response.json();
        setModels(modelsData);
      }
    } catch (err) {
      console.error("Error loading models:", err);
      setModels([]);
    }
  }, []);

  useEffect(() => {
    if (tenantId) {
      loadVehicles();
      loadMakes();
    }
  }, [tenantId, loadVehicles, loadMakes]);

  const handleAddVehicle = async (data: VehicleFormData) => {
    const response = await fetch("/api/vehicles/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add vehicle");
    }

    await loadVehicles();
  };

  const handleEditVehicle = async (id: string, data: VehicleEditFormData) => {
    const response = await fetch(`/api/vehicles/${id}/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        make: data.make || null,
        model: data.model || null,
        licensePlate: data.regNo || null,
        year: data.year ? parseInt(data.year) : null,
        color: data.color || null,
        mileage: data.odometer ? parseInt(data.odometer) : null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update vehicle");
    }

    await loadVehicles();
  };

  const handleDeleteVehicle = async (id: string) => {
    const response = await fetch(`/api/vehicles/${id}/delete`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete vehicle");
    }

    await loadVehicles();
  };

  const handleCreateJob = (vehicle: VehicleViewModel) => {
    // Navigate to job creation with vehicle pre-selected
    router.push(`/jobs-board?vehicleId=${vehicle.id}`);
  };

  return (
    <VehiclesView
      vehicles={vehicles}
      loading={loading}
      error={error}
      makes={makes}
      models={models}
      onMakeChange={loadModels}
      onAddVehicle={handleAddVehicle}
      onEditVehicle={handleEditVehicle}
      onDeleteVehicle={handleDeleteVehicle}
      onRetry={loadVehicles}
      onCreateJob={handleCreateJob}
    />
  );
}

