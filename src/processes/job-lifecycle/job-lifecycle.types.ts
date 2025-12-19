import { UUID } from "crypto";

export interface createJobCommand {
  customer_id: UUID;
  vehicle_id: UUID;
  description: string;
}
export interface jobStatusCommand {
  job_id: UUID;
  status: "received" | "working" | "ready" | "completed" | "cancelled";
}

export interface assignMechanicCommand {
  job_id: UUID;
  mechanic_id: UUID;
}

export interface updateEstimateCommand {
  job_id: UUID;
  estimate_id: UUID;
  parts: Array<{
    part_name: string;
    quantity: number;
    price_per_unit: number;
    labor_cost: number;
  }>;
}
export interface initiatePaymentCommand {
  job_id: UUID;
  amount: number;
  payment_method: string;
}
