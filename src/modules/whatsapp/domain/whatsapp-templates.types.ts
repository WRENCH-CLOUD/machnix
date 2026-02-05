/**
 * WhatsApp Template Types
 * 
 * Defines the structure for Gupshup/WhatsApp Business API templates.
 * Templates must be approved by Meta before use.
 */

/**
 * Vehicle Status Update Template
 * 
 * Template text:
 * "Your vehicle *{{1}}* is {{2}} at *{{3}}*.
 * 
 * Note: {{4}}
 * 
 * Thank you for choosing us."
 * 
 * Parameters:
 * - {{1}}: Vehicle name (e.g., "Honda City KA01AB1234")
 * - {{2}}: Status (e.g., "ready for pickup", "under inspection")
 * - {{3}}: Garage name (e.g., "ABC Motors")
 * - {{4}}: Additional note (e.g., "Please bring your invoice")
 */
export interface VehicleStatusUpdateParams {
    vehicleName: string    // {{1}}
    status: string         // {{2}}
    garageName: string     // {{3}}
    note: string           // {{4}}
}

/**
 * All available WhatsApp template types
 */
export type WhatsAppTemplateType =
    | 'vehicle_status_update'
// Add more template types here as they get approved
// | 'invoice_created'
// | 'payment_received'

/**
 * Template parameter mapping
 */
export type WhatsAppTemplateParams = {
    vehicle_status_update: VehicleStatusUpdateParams
}

/**
 * Outbound WhatsApp message record
 */
export interface WhatsAppMessage {
    id: string
    tenantId: string
    templateType: WhatsAppTemplateType
    customerPhone: string
    customerName?: string
    jobId?: string
    invoiceId?: string
    status: 'pending' | 'sent' | 'delivered' | 'failed'
    messageId?: string  // Gupshup message ID
    sentAt?: Date
    createdAt: Date
}
