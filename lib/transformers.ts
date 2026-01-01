import type { JobcardWithRelations } from "@/lib/supabase/services/job.service"
import type { JobCard, JobStatus, Part } from "@/lib/mock-data"

export function transformJobToJobCard(job: JobcardWithRelations): JobCard {
  // Safe defaults for required customer/vehicle if they are missing
  const customer = job.customer ? {
    id: job.customer.id,
    name: job.customer.name,
    phone: job.customer.phone || "",
    email: job.customer.email || "",
    address: job.customer.address || undefined
  } : {
    id: "unknown",
    name: "Unknown Customer",
    phone: "",
    email: ""
  };

  const vehicle = job.vehicle ? {
    id: job.vehicle.id,
    make: job.vehicle.make?.name || "Unknown Make",
    model: job.vehicle.model?.name || "Unknown Model",
    year: job.vehicle.year || new Date().getFullYear(),
    regNo: job.vehicle.reg_no,
    color: "Unknown", // Not in DB
    vin: job.vehicle.vin || undefined
  } : {
    id: "unknown",
    make: "Unknown",
    model: "Unknown",
    year: new Date().getFullYear(),
    regNo: "Unknown",
    color: "Unknown"
  };

  const mechanic = job.mechanic ? {
    id: job.mechanic.id,
    name: job.mechanic.name,
    avatar: "/placeholder.svg", // Default
    specialty: (job.mechanic.skills && job.mechanic.skills.length > 0) ? job.mechanic.skills[0] : "General",
    phone: job.mechanic.phone || ""
  } : undefined;

  const parts: Part[] = (job.part_usages || []).map(usage => ({
    id: usage.id,
    name: "Part", // Name not directly in part_usage, would need join, defaulting for now
    partNumber: "", // Not in part_usage
    quantity: usage.qty,
    unitPrice: usage.unit_price || 0,
    laborCost: 0 // Not in part_usage
  }));

  // Calculate totals
  const partsTotal = parts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);
  const laborTotal = parts.reduce((sum, p) => sum + p.laborCost, 0); // Simplified
  const tax = (partsTotal + laborTotal) * 0.18; // Default 18% tax

  return {
    id: job.id,
    jobNumber: job.job_number,
    customer,
    vehicle,
    mechanic,
    status: (job.status as JobStatus) || "received",
    dviPending: false, // Default as per requirements
    dviTemplate: undefined,
    dviItems: [], // Default empty
    parts,
    activities: [], // Default empty
    laborTotal,
    partsTotal,
    tax,
    createdAt: new Date(job.created_at),
    updatedAt: new Date(job.updated_at),
    estimatedCompletion: undefined,
    complaints: (job.details as any)?.complaints || "", // Extract from JSON details if possible
    notes: (job.details as any)?.notes || ""
  };
}
