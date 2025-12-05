// Job related types
export type JobStatus = "received" | "working" | "ready" | "completed"

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address?: string
}

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  regNo: string
  color: string
  vin?: string
}

export interface Mechanic {
  id: string
  name: string
  avatar: string
  specialty: string
  phone: string
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

export interface JobCard {
  id: string
  jobNumber: string
  customer: Customer
  vehicle: Vehicle
  mechanic?: Mechanic
  status: JobStatus
  dviPending: boolean
  dviTemplate?: string
  dviItems: DVIItem[]
  parts: Part[]
  activities: Activity[]
  laborTotal: number
  partsTotal: number
  tax: number
  createdAt: Date
  updatedAt: Date
  estimatedCompletion?: Date
  complaints: string
  notes?: string
}

// Status configuration type
export interface StatusConfig {
  label: string
  color: string
  bgColor: string
}
