export interface VehicleViewModel {
  id: string;
  makeName: string;
  modelName: string;
  regNo: string;
  year?: number;
  color?: string;
  odometer?: number;
  ownerName?: string;
  totalJobs?: number;
  lastService?: Date;
}

export interface VehicleFormData {
  makeId: string;
  model: string;
  regNo: string;
  year: string;
  color: string;
  odometer: string;
  ownerPhone: string;
}

// Using Record<string, any> to handle the complex join result from Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformVehicleToViewModel(vehicle: Record<string, any>): VehicleViewModel {
  return {
    id: vehicle.id,
    makeName: vehicle.make || "Unknown",
    modelName: vehicle.model || "Unknown",
    regNo: vehicle.reg_no,
    year: vehicle.year,
    color: vehicle.color,
    odometer: vehicle.odometer,
    ownerName: vehicle.customer?.name || "Unknown",
    totalJobs: vehicle.jobs?.length || 0,
    lastService: vehicle.jobs?.[0]?.created_at
      ? new Date(vehicle.jobs[0].created_at)
      : undefined
  };
}
