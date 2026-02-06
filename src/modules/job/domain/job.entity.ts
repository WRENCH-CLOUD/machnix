/**
 * Job Status Types
 */
export type JobStatus = 'received' | 'working' | 'ready' | 'completed' | 'cancelled'

/**
 * JobCard Entity
 * Domain model representing a job/work order in the system
 */
export interface JobCard {
  id: string
  tenantId: string
  jobNumber: string
  customerId: string
  vehicleId: string
  status: JobStatus
  createdBy?: string
  assignedMechanicId?: string
  description?: string
  notes?: string
  details: Record<string, any>
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}

/**
 * JobCard with related entities
 */
export interface JobCardWithRelations extends JobCard {
  customer?: any
  vehicle?: any
  mechanic?: any
}

// Note: DVI (Digital Vehicle Inspection) items will be added in a future version
// per ROADMAP - currently excluded from V1

/**
 * Status Configuration
 * Display properties for each job status used across the UI
 */
export interface StatusConfigItem {
  label: string
  color: string
  bgColor: string
}

export const statusConfig: Record<JobStatus, StatusConfigItem> = {
  received: {
    label: 'Received',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  working: {
    label: 'Working',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
  ready: {
    label: 'Ready for Delivery',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
  completed: {
    label: 'Completed',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
}