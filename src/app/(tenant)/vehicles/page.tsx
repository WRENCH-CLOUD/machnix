"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { VehiclesView } from "@/components/tenant/views/vehicles-view";
import { useVehicles, useVehicleMakes, useInvalidateQueries } from "@/hooks";
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
  const { data: vehiclesData, isLoading, error } = useVehicles();
  const { data: makesData } = useVehicleMakes();
  const { invalidateVehicles } = useInvalidateQueries();
  
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);

  // Transform API data to UI format
  const vehicles: VehicleViewModel[] = useMemo(() => {
    if (!vehiclesData) return [];
    return vehiclesData.map(transformVehicleToViewModel);
  }, [vehiclesData]);

  const makes = useMemo(() => makesData || [], [makesData]);

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

    await invalidateVehicles();
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

    await invalidateVehicles();
  };

  const handleDeleteVehicle = async (id: string) => {
    const response = await fetch(`/api/vehicles/${id}/delete`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete vehicle");
    }

    await invalidateVehicles();
  };

  const handleCreateJob = (vehicle: VehicleViewModel) => {
    router.push(`/jobs-board?vehicleId=${vehicle.id}`);
  };

  return (
    <VehiclesView
      vehicles={vehicles}
      loading={isLoading}
      error={error?.message || null}
      makes={makes}
      models={models}
      onMakeChange={loadModels}
      onAddVehicle={handleAddVehicle}
      onEditVehicle={handleEditVehicle}
      onDeleteVehicle={handleDeleteVehicle}
      onRetry={invalidateVehicles}
      onCreateJob={handleCreateJob}
    />
  );
}
