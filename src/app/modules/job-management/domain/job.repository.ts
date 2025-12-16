import { JobCard, JobCardWithRelations, JobStatus } from './job.entity'

export interface JobRepository {
  findAll(): Promise<JobCardWithRelations[]>
  findByStatus(status: JobStatus): Promise<JobCardWithRelations[]>
  findById(id: string): Promise<JobCardWithRelations | null>
  findByCustomerId(customerId: string): Promise<JobCard[]>
  findByVehicleId(vehicleId: string): Promise<JobCard[]>
  findByMechanicId(mechanicId: string): Promise<JobCard[]>
  create(job: Omit<JobCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobCard>
  update(id: string, updates: Partial<JobCard>): Promise<JobCard>
  updateStatus(id: string, status: JobStatus): Promise<JobCard>
  delete(id: string): Promise<void>
}
