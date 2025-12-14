// Job related types
export type JobStatus = "received" | "working" | "ready" | "completed" | "cancelled"
export type EstimateStatus = "draft" | "pending" | "approved" | "rejected" | "expired"
export type InvoiceStatus = "pending" | "paid" | "partially_paid" | "overdue" | "cancelled"
export type PaymentStatus = "initiated" | "success" | "failed"
export type PaymentMode = "cash" | "razorpay" | "card" | "upi" | "bank_transfer"
export type UserRole = "admin" | "tenant" | "mechanic" | "employee"

export interface Customer {
  id: string
  tenant_id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
}

export interface VehicleMake {
  id: string
  name: string
  code?: string
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface VehicleModel {
  id: string
  make_id: string
  name: string
  model_code?: string
  vehicle_category?: string
  year_start?: number
  year_end?: number
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  tenant_id: string
  customer_id: string
  make: string
  model: string
  year?: number
  vin?: string
  license_plate?: string
  color?: string
  mileage?: number
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
}

export interface User {
  id: string
  tenant_id: string
  auth_user_id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
}

export interface Mechanic extends User {
  specialty?: string
}

export interface DVIItem {
  id: string
  category: string
  name: string
  status: "good" | "attention" | "urgent" | "pending"
  note?: string
  photos?: string[]
}

export interface Part {
  id: string
  name: string
  partNumber: string
  quantity: number
  unitPrice: number
  laborCost: number
}

export interface Activity {
  id: string
  timestamp: Date
  type: "status_change" | "note" | "dvi_update" | "payment" | "estimate_sent"
  description: string
  user: string
}

export interface EstimateItem {
  id: string
  estimate_id: string
  part_id?: string
  custom_name?: string
  custom_part_number?: string
  description?: string
  qty: number
  unit_price: number
  labor_cost: number
  total: number
  created_at: string
  deleted_at?: string
}

export interface Estimate {
  id: string
  tenant_id: string
  customer_id: string
  vehicle_id: string
  jobcard_id?: string
  estimate_number: string
  status: EstimateStatus
  description?: string
  labor_total: number
  parts_total: number
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  valid_until?: string
  approved_at?: string
  approved_by?: string
  rejected_at?: string
  rejected_by?: string
  rejection_reason?: string
  created_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
}

export interface Invoice {
  id: string
  tenant_id: string
  customer_id: string
  jobcard_id?: string
  estimate_id?: string
  invoice_number?: string
  status: InvoiceStatus
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  balance: number
  invoice_date: string
  due_date?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
}

export interface PaymentTransaction {
  id: string
  tenant_id: string
  invoice_id: string
  mode: PaymentMode
  amount: number
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
  status: PaymentStatus
  created_at: string
  paid_at?: string
  deleted_at?: string
  deleted_by?: string
}

export interface Payment {
  id: string
  tenant_id: string
  invoice_id: string
  amount: number
  payment_method: PaymentMode
  status: PaymentStatus
  reference_number?: string
  gateway_ref?: string
  notes?: string
  received_by?: string
  payment_date: string
  created_at: string
  deleted_at?: string
  deleted_by?: string
}

export interface JobCard {
  id: string
  tenant_id: string
  job_number: string
  customer_id: string
  vehicle_id: string
  status: JobStatus
  created_by?: string
  assigned_mechanic_id?: string
  description?: string
  notes?: string
  details: Record<string, any>
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
  // Populated fields
  customer?: Customer
  vehicle?: Vehicle
  mechanic?: Mechanic
  dviPending?: boolean
  dviTemplate?: string
  dviItems?: DVIItem[]
  parts?: Part[]
  activities?: Activity[]
  laborTotal?: number
  partsTotal?: number
  tax?: number
  estimatedCompletion?: string
  complaints?: string
}

export interface Tenant {
  id: string
  name: string
  slug?: string
  created_at: string
  metadata: Record<string, any>
}

// Status configuration type
export interface StatusConfig {
  label: string
  color: string
  bgColor: string
}
