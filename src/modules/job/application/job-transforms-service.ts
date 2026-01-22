/**
 * Transform database job data to UI format
 * Converts field names and enriches with dummy data
 */

import { container } from 'tsyringe'

import { REPOSITORY_TOKENS } from '@/shared/container/bindings'
import type { EstimateRepository } from '@/modules/estimate/domain/estimate.repository'
import type { JobCardWithRelations } from '@/modules/job/domain/job.entity'

import { enrichJobWithDummyData } from '@/shared/utils/dvi-dummy-data'

export interface UIJob {
  id: string
  jobNumber: string
  customer: {
    id: string
    name: string
    phone: string | null
    email: string | null
    address?: string | null
  }
  vehicle: {
    id: string
    make: string
    model: string
    year: number | null
    regNo: string
    color: string | null
  }
  mechanic?: {
    id: string
    name: string
    phone: string | null
    email: string | null
    avatar?: string | null
    specialty?: string
  } | null
  status: string
  dviPending?: boolean
  dviTemplate?: string
  dviItems: any[]
  parts: any[]
  activities: any[]
  laborTotal: number
  partsTotal: number
  tax: number
  createdAt: Date | string
  updatedAt: Date | string
  created_at?: Date | string
  updated_at?: Date | string
  estimatedCompletion?: Date | string
  complaints: string
  todos?: {
    id: string
    text: string
    completed: boolean
    createdAt: string
    completedAt?: string
  }[]
}

/**
 * Transform database jobcard to UI format
 * Now async to support make/model lookupsama
 */
export async function transformDatabaseJobToUI(dbJob: JobCardWithRelations): Promise<UIJob> {
  // Extract vehicle data and attempt to resolve naming inconsistencies between schemas
  const vehicle = dbJob.vehicle ?? {}

  const vehicleMake = vehicle.make ?? vehicle.make_name ?? 'Unknown Make'
  const vehicleModel = vehicle.model ?? vehicle.model_name ?? 'Unknown Model'
  const vehicleReg = vehicle.licensePlate ?? vehicle.license_plate ?? vehicle.reg_no ?? 'N/A'
  const vehicleColor = vehicle.color ?? vehicle.colour ?? null
  
  // Transform to UI format
  const uiJob: any = {
    id: dbJob.id,
    jobNumber: dbJob.jobNumber || 'N/A',
    customer: {
      id: dbJob.customer?.id || '',
      name: dbJob.customer?.name || 'Unknown Customer',
      phone: dbJob.customer?.phone || null,
      email: dbJob.customer?.email || null,
      address: dbJob.customer?.address || null,
    },
    vehicle: {
      id: vehicle?.id || '',
      make: vehicleMake,
      model: vehicleModel,
      year: vehicle?.year || null,
      regNo: vehicleReg,
      color: vehicleColor,
    },
    mechanic: dbJob.mechanic ? {
      id: dbJob.mechanic.id,
      name: dbJob.mechanic.name,
      phone: dbJob.mechanic.phone || null,
      email: dbJob.mechanic.email || null,
      avatar: null, // TODO: add avatar field to mechanic table
      specialty: 'Mechanic', // TODO: add specialty field to database
    } : null,
    status: dbJob.status,
    complaints: extractComplaints(dbJob.details),
    todos: extractTodos(dbJob.details),
    createdAt: dbJob.createdAt,
    updatedAt: dbJob.updatedAt,
    created_at: dbJob.createdAt,
    updated_at: dbJob.updatedAt,
  }

  // Try to load estimate data for accurate totals (server-side only)
  // Skip on client-side to avoid 401 errors from direct Supabase calls
  const isClient = typeof window !== 'undefined'
  if (!isClient) {
    const estimateRepository = resolveEstimateRepository()
    if (estimateRepository) {
      try {
        const estimates = await estimateRepository.findByJobcardId(dbJob.id)
        const estimate = estimates[0]
        if (estimate) {
          uiJob.partsTotal = estimate.partsTotal ?? 0
          uiJob.laborTotal = estimate.laborTotal ?? 0
          uiJob.tax = estimate.taxAmount ?? 0
        }
      } catch (error) {
        console.debug(`[job-transforms] No estimate found for job ${dbJob.jobNumber}`, error)
      }
    }
  }

  // Enrich with dummy DVI data and other fields
  return enrichJobWithDummyData(uiJob)
}

/**
 * Extract complaints from job details JSONB field
 */
function extractComplaints(details: any): string {
  if (!details) return 'No complaints recorded'
  
  if (typeof details === 'string') return details
  
  if (typeof details === 'object') {
    return details.complaints || details.description || 'No complaints recorded'
  }
  
  return 'No complaints recorded'
}

/**
 * Extract todos from job details JSONB field
 */
function extractTodos(details: any): { id: string; text: string; completed: boolean; createdAt: string; completedAt?: string }[] {
  if (!details || typeof details !== 'object') return []
  
  if (Array.isArray(details.todos)) {
    return details.todos
  }
  
  return []
}

/**
 * Transform UI job data back to database format for updates
 */
export function transformUIJobToDatabase(uiJob: UIJob): Record<string, any> {
  return {
    id: uiJob.id,
    job_number: uiJob.jobNumber,
    status: uiJob.status,
    details: {
      complaints: uiJob.complaints,
    },
    updated_at: new Date().toISOString(),
  }
}

let cachedEstimateRepository: EstimateRepository | null = null

function resolveEstimateRepository(): EstimateRepository | null {
  if (cachedEstimateRepository) return cachedEstimateRepository

  try {
    cachedEstimateRepository = container.resolve<EstimateRepository>(REPOSITORY_TOKENS.estimate)
    return cachedEstimateRepository
  } catch (error) {
    console.debug('[job-transforms] Failed to resolve EstimateRepository from container', error)
    return null
  }
}
