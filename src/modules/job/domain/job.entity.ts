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

// TODO: add DVI items 

// TODO: add statusConfig