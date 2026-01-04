import { supabase as defaultSupabase, ensureTenantContext } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Base repository class for Supabase implementations.
 * Provides common functionality for tenant-aware data access.
 * 
 * @template TEntity - The domain entity type
 * @template TDbRow - The database row type (defaults to Record<string, unknown>)
 */
export abstract class BaseSupabaseRepository<TEntity, TDbRow = Record<string, unknown>> {
  protected supabase: SupabaseClient
  protected tenantId?: string

  constructor(supabase?: SupabaseClient, tenantId?: string) {
    this.supabase = supabase || defaultSupabase
    this.tenantId = tenantId
  }

  /**
   * Get the current tenant ID from constructor or context
   */
  protected getContextTenantId(): string {
    return this.tenantId || ensureTenantContext()
  }

  /**
   * Transform a database row to a domain entity.
   * Must be implemented by derived classes.
   */
  protected abstract toDomain(row: TDbRow): TEntity

  /**
   * Transform a domain entity to a database row for insert operations.
   * Must be implemented by derived classes.
   */
  protected abstract toDatabase(entity: Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>): TDbRow
}
