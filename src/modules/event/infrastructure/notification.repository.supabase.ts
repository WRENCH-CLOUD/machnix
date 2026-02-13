/**
 * Supabase Notification Repositories
 * 
 * Infrastructure implementations for:
 *   - public.notifications (platform admin)
 *   - tenant.notifications (tenant users)
 */

import { SupabaseClient } from '@supabase/supabase-js'
import {
  PlatformNotificationRepository,
  TenantNotificationRepository,
} from '../domain/notification.repository'
import {
  PlatformNotification,
  CreatePlatformNotificationDTO,
  TenantNotification,
  CreateTenantNotificationDTO,
} from '../domain/notification.entity'

// ─── Platform Notification Repository ───────────────────────────────────────

export class SupabasePlatformNotificationRepository
  implements PlatformNotificationRepository
{
  constructor(private readonly supabase: SupabaseClient) {}

  private toDomain(row: Record<string, unknown>): PlatformNotification {
    return {
      id: row.id as string,
      recipientId: row.recipient_id as string | undefined,
      tenantId: row.tenant_id as string | undefined,
      title: row.title as string,
      message: row.message as string,
      category: row.category as PlatformNotification['category'],
      severity: row.severity as PlatformNotification['severity'],
      entityType: row.entity_type as PlatformNotification['entityType'],
      entityId: row.entity_id as string | undefined,
      sourceEventId: row.source_event_id as string | undefined,
      isRead: row.is_read as boolean,
      readAt: row.read_at ? new Date(row.read_at as string) : undefined,
      createdAt: new Date(row.created_at as string),
    }
  }

  async create(dto: CreatePlatformNotificationDTO): Promise<PlatformNotification> {
    const { data, error } = await this.supabase
      .from('notifications') // public schema is default
      .insert({
        recipient_id: dto.recipientId ?? null,
        tenant_id: dto.tenantId ?? null,
        title: dto.title,
        message: dto.message,
        category: dto.category,
        severity: dto.severity,
        entity_type: dto.entityType ?? null,
        entity_id: dto.entityId ?? null,
        source_event_id: dto.sourceEventId ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(`Create platform notification failed: ${error.message}`)
    return this.toDomain(data)
  }

  async findUnread(recipientId?: string): Promise<PlatformNotification[]> {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (recipientId) {
      query = query.or(`recipient_id.eq.${recipientId},recipient_id.is.null`)
    }

    const { data, error } = await query
    if (error) throw new Error(`Fetch unread failed: ${error.message}`)
    return (data ?? []).map((row) => this.toDomain(row))
  }

  async markRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw new Error(`Mark read failed: ${error.message}`)
  }

  async markAllRead(recipientId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .or(`recipient_id.eq.${recipientId},recipient_id.is.null`)
      .eq('is_read', false)

    if (error) throw new Error(`Mark all read failed: ${error.message}`)
  }
}

// ─── Tenant Notification Repository ─────────────────────────────────────────

export class SupabaseTenantNotificationRepository
  implements TenantNotificationRepository
{
  constructor(private readonly supabase: SupabaseClient) {}

  private toDomain(row: Record<string, unknown>): TenantNotification {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      customerId: row.customer_id as string | undefined,
      jobcardId: row.jobcard_id as string | undefined,
      userId: row.user_id as string | undefined,
      title: (row.title as string) ?? '',
      message: (row.message as string) ?? '',
      channel: row.channel as string,
      template: row.template as string | undefined,
      payload: row.payload as Record<string, unknown> | undefined,
      status: row.status as string,
      category: (row.category as TenantNotification['category']) ?? 'system',
      severity: (row.severity as TenantNotification['severity']) ?? 'info',
      entityType: row.entity_type as TenantNotification['entityType'],
      entityId: row.entity_id as string | undefined,
      sourceEventId: row.source_event_id as string | undefined,
      isRead: row.is_read as boolean,
      readAt: row.read_at ? new Date(row.read_at as string) : undefined,
      sentAt: row.sent_at ? new Date(row.sent_at as string) : undefined,
      createdAt: new Date(row.created_at as string),
    }
  }

  async create(dto: CreateTenantNotificationDTO): Promise<TenantNotification> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('notifications')
      .insert({
        tenant_id: dto.tenantId,
        user_id: dto.userId ?? null,
        customer_id: dto.customerId ?? null,
        jobcard_id: dto.jobcardId ?? null,
        title: dto.title,
        message: dto.message,
        channel: dto.channel,
        template: dto.template ?? null,
        payload: dto.payload ?? null,
        category: dto.category ?? 'system',
        severity: dto.severity ?? 'info',
        entity_type: dto.entityType ?? null,
        entity_id: dto.entityId ?? null,
        source_event_id: dto.sourceEventId ?? null,
        status: 'sent',
      })
      .select()
      .single()

    if (error) throw new Error(`Create tenant notification failed: ${error.message}`)
    return this.toDomain(data)
  }

  async findByUser(
    tenantId: string,
    userId: string
  ): Promise<TenantNotification[]> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(`Find notifications failed: ${error.message}`)
    return (data ?? []).map((row) => this.toDomain(row))
  }

  async findUnread(
    tenantId: string,
    userId: string
  ): Promise<TenantNotification[]> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Find unread failed: ${error.message}`)
    return (data ?? []).map((row) => this.toDomain(row))
  }

  async markRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .schema('tenant')
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw new Error(`Mark read failed: ${error.message}`)
  }

  async markAllRead(tenantId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .schema('tenant')
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw new Error(`Mark all read failed: ${error.message}`)
  }
}
