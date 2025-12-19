import { container } from 'tsyringe'

import type { AuthRepository } from '@/modules/access/infrastructure/auth.repository'
import { SupabaseAuthRepository } from '@/modules/access/infrastructure/auth.repository.supabase'
import type { TenantUserRepository } from '@/modules/access/infrastructure/tenant-user.repository'
import { SupabaseTenantUserRepository } from '@/modules/access/infrastructure/tenant-user.repository.supabase'

import type { TenantRepository } from '@/modules/tenant/infrastructure/tenant.repository'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'

import type { CustomerRepository } from '@/modules/customer/domain/customer.repository'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'

import type { EstimateRepository } from '@/modules/estimate/domain/estimate.repository'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'

import type { InvoiceRepository } from '@/modules/invoice-management/domain/invoice.repository'
import { SupabaseInvoiceRepository } from '@/modules/invoice-management/infrastructure/invoice.repository.supabase'

import type { JobRepository } from '@/modules/job-management/domain/job.repository'
import { SupabaseJobRepository } from '@/modules/job-management/infrastructure/job.repository.supabase'

import type { UserRepository } from '@/modules/user/domain/user.repository'
import { SupabaseUserRepository } from '@/modules/user/infrastructure/user.repository.supabase'

import type { VehicleRepository } from '@/modules/vehicle/domain/vehicle.repository'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'

import { CreateTenantWithOwnerUseCase } from '@/modules/tenant/application/create-tenant-with-owner-usecase'

export const REPOSITORY_TOKENS = {
  auth: 'AuthRepository',
  tenantUser: 'TenantUserRepository',
  tenant: 'TenantRepository',
  customer: 'CustomerRepository',
  estimate: 'EstimateRepository',
  invoice: 'InvoiceRepository',
  job: 'JobRepository',
  user: 'UserRepository',
  vehicle: 'VehicleRepository'
} as const

container.registerSingleton<AuthRepository>(REPOSITORY_TOKENS.auth, SupabaseAuthRepository)
container.registerSingleton<TenantUserRepository>(REPOSITORY_TOKENS.tenantUser, SupabaseTenantUserRepository)
container.registerSingleton<TenantRepository>(REPOSITORY_TOKENS.tenant, SupabaseTenantRepository)
container.registerSingleton<CustomerRepository>(REPOSITORY_TOKENS.customer, SupabaseCustomerRepository)
container.registerSingleton<EstimateRepository>(REPOSITORY_TOKENS.estimate, SupabaseEstimateRepository)
container.registerSingleton<InvoiceRepository>(REPOSITORY_TOKENS.invoice, SupabaseInvoiceRepository)
container.registerSingleton<JobRepository>(REPOSITORY_TOKENS.job, SupabaseJobRepository)
container.registerSingleton<UserRepository>(REPOSITORY_TOKENS.user, SupabaseUserRepository)
container.registerSingleton<VehicleRepository>(REPOSITORY_TOKENS.vehicle, SupabaseVehicleRepository)

container.registerSingleton(CreateTenantWithOwnerUseCase, CreateTenantWithOwnerUseCase)
