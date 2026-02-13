/**
 * Notification Repository Interface
 * 
 * Separate contracts for public and tenant notification persistence.
 */

import {
  PlatformNotification,
  CreatePlatformNotificationDTO,
  TenantNotification,
  CreateTenantNotificationDTO,
} from './notification.entity'

export interface PlatformNotificationRepository {
  create(dto: CreatePlatformNotificationDTO): Promise<PlatformNotification>
  findUnread(recipientId?: string): Promise<PlatformNotification[]>
  markRead(notificationId: string): Promise<void>
  markAllRead(recipientId: string): Promise<void>
}

export interface TenantNotificationRepository {
  create(dto: CreateTenantNotificationDTO): Promise<TenantNotification>
  findByUser(tenantId: string, userId: string): Promise<TenantNotification[]>
  findUnread(tenantId: string, userId: string): Promise<TenantNotification[]>
  markRead(notificationId: string): Promise<void>
  markAllRead(tenantId: string, userId: string): Promise<void>
}
