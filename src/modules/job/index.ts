// application layer exports
export {AssignMechanicUseCase} from './application/assign-mechanic.usecase'
export {transformDatabaseJobToUI, type UIJob} from './application/job-transforms-service'
export { GetAllJobsUseCase } from './application/get-all-jobs.use-case'
export { CreateJobUseCase } from './application/create-job.use-case'
export { UpdateJobStatusUseCase } from './application/update-job-status.use-case'
export { TaskEstimateSyncService } from './application/task-estimate-sync.service'


// domain layer exports
export { SupabaseTaskRepository } from './infrastructure/task.repository.supabase'
export type { JobCard, JobCardWithRelations, JobStatus } from './domain/job.entity'
export type { JobRepository } from './domain/job.repository'
export type { TaskActionType } from './domain/task.entity'
export type { TaskRepository } from './domain/task.repository'
export type { TaskStatus } from './domain/task.entity'

// infrastructure layer exports
export { SupabaseJobRepository } from './infrastructure/job.repository.supabase'

