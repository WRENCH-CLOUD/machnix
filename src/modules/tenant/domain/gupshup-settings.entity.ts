
/**
 * Tenant Gupshup Settings Entity
 * 
 * Controls whether a tenant has WhatsApp notifications enabled.
 * Note: Source number is now centralized at platform level in env vars.
 */

export interface GupshupSettings {
    id: string
    tenantId: string
    sourceNumber: string  // Legacy field, now populated from platform config
    isActive: boolean
    triggerMode: 'manual'  // Only manual is supported now
    createdAt: Date
    updatedAt: Date
}
