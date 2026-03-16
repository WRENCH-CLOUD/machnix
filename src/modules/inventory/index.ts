// application layer exports
export * from './application/inventory-allocation.service'

// domain layer exports
export * from './domain/inventory.entity'
export * from './domain/inventory.repository'
export * from './domain/allocation.entity'
export * from './domain/allocation.repository'

// infrastructure layer exports
export * from './infrastructure/inventory.repository.supabase'
export * from './infrastructure/allocation.repository.supabase'
