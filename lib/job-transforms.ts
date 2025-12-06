/**
 * Transform database job data to UI format
 * Converts field names and enriches with dummy data
 */

import { enrichJobWithDummyData } from './dvi-dummy-data'
import type { JobcardWithRelations } from './supabase/services/job.service'
import { VehicleService } from './supabase/services'

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
}

/**
 * Transform database jobcard to UI format
 * Now async to support make/model lookups
 */
export async function transformDatabaseJobToUI(dbJob: JobcardWithRelations): Promise<UIJob> {
  // Extract vehicle data and handle make/model lookup
  const vehicle = dbJob.vehicle
  
  // Look up actual make and model names from public schema
  let vehicleMake = 'Unknown Make'
  let vehicleModel = 'Unknown Model'
  
  if (vehicle?.make_id) {
    const make = await VehicleService.getMakeById(vehicle.make_id)
    if (make) vehicleMake = make.name
  }
  
  if (vehicle?.model_id) {
    const model = await VehicleService.getModelById(vehicle.model_id)
    if (model) vehicleModel = model.name
  }
  
  // Transform to UI format
  const uiJob: any = {
    id: dbJob.id,
    jobNumber: dbJob.job_number || 'N/A',
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
      regNo: vehicle?.reg_no || 'N/A',
      color: null, // TODO: add color field to vehicle table
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
    createdAt: dbJob.created_at,
    updatedAt: dbJob.updated_at,
    created_at: dbJob.created_at,
    updated_at: dbJob.updated_at,
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
 * Transform UI job data back to database format for updates
 */
export function transformUIJobToDatabase(uiJob: UIJob): Partial<JobcardWithRelations> {
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
