
/**
 * Tenant Gupshup Settings Entity
 * 
 * Controls whether a tenant has WhatsApp notifications enabled.
 * Note: Source number is now centralized at platform level in env vars.
 */

export type TriggerMode = 'manual' | 'auto' | 'both'

export interface GupshupSettings {
    id: string
    tenantId: string
    sourceNumber: string  // Legacy field, now populated from platform config
    isActive: boolean
    triggerMode: TriggerMode
    createdAt: Date
    updatedAt: Date
}
