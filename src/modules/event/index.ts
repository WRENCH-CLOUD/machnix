/**
 * Event Module — Barrel Exports
 * 
 * Re-exports all public API from the event module.
 */

// Domain
export * from './domain/event-types'
export * from './domain/event.entity'
export * from './domain/event.repository'
export * from './domain/notification.entity'
export * from './domain/notification.repository'

// Application
export { PublishEventUseCase } from './application/publish-event.use-case'
export { EventProcessorService } from './application/event-processor.service'
export type { EventProcessorConfig } from './application/event-processor.service'
export { GetEventHistoryUseCase } from './application/get-event-history.use-case'
export { generateNotifications } from './application/notification-generator'

// Infrastructure
export { SupabaseEventRepository } from './infrastructure/event.repository.supabase'
export {
  SupabasePlatformNotificationRepository,
  SupabaseTenantNotificationRepository,
} from './infrastructure/notification.repository.supabase'
