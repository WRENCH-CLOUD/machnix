import { env } from '@/lib/env'

export type WhatsAppTemplateType = 'vehicle_status_update'

export interface VehicleStatusUpdateParams {
    vehicleName: string
    status: string
    garageName: string
    note: string
}

interface SendMessageResponse {
    messageId: string
    status: 'submitted' | 'failed'
    error?: string
}

/**
 * Gupshup WhatsApp Business API Service
 * 
 * Centralized service for sending WhatsApp template messages via Gupshup.
 * Uses platform-level credentials AND source number from env vars.
 * All messages are sent from the single WrenchCloud WhatsApp number.
 */
export class GupshupService {
    private readonly apiUrl = 'https://api.gupshup.io/wa/api/v1/msg'

    /** Check if Gupshup is configured at the platform level */
    isConfigured(): boolean {
        return env.hasGupshupConfig
    }

    /** Get the centralized WrenchCloud source number */
    getSourceNumber(): string | undefined {
        return env.GUPSHUP_SOURCE_NUMBER
    }

    /** Get the template ID for a given template type */
    private getTemplateId(templateType: WhatsAppTemplateType): string | undefined {
        const templateMap: Record<WhatsAppTemplateType, string | undefined> = {
            vehicle_status_update: env.GUPSHUP_TEMPLATE_VEHICLE_STATUS,
        }
        return templateMap[templateType]
    }

    /** Format phone number to international format */
    private formatPhoneNumber(phone: string): string {
        let cleaned = phone.replace(/\D/g, '')
        if (cleaned.length === 10) {
            cleaned = '91' + cleaned
        }
        return cleaned
    }

    /** Send a template message via Gupshup API */
    async sendTemplateMessage(
        destination: string,
        templateId: string,
        params: string[]
    ): Promise<SendMessageResponse> {
        if (!this.isConfigured()) {
            return {
                messageId: '',
                status: 'failed',
                error: 'Gupshup is not configured. Missing API key, app name, or source number.'
            }
        }

        const sourceNumber = this.getSourceNumber()
        if (!sourceNumber) {
            return {
                messageId: '',
                status: 'failed',
                error: 'No source number configured'
            }
        }

        const formattedPhone = this.formatPhoneNumber(destination)

        const body = new URLSearchParams({
            channel: 'whatsapp',
            source: sourceNumber,
            destination: formattedPhone,
            'src.name': env.GUPSHUP_APP_NAME!,
            template: JSON.stringify({
                id: templateId,
                params: params,
            }),
        })

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'apikey': env.GUPSHUP_API_KEY!,
                },
                body: body.toString(),
            })

            const data = await response.json()

            if (!response.ok) {
                console.error('[GupshupService] API error:', data)
                return {
                    messageId: '',
                    status: 'failed',
                    error: data.message || 'API request failed'
                }
            }

            return {
                messageId: data.messageId || '',
                status: 'submitted',
            }
        } catch (error) {
            console.error('[GupshupService] Failed to send message:', error)
            return {
                messageId: '',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Send a vehicle status update to a customer
     * 
     * Template: "Your vehicle *{{1}}* is {{2}} at *{{3}}*.
     *           Note: {{4}}
     *           Thank you for choosing us."
     */
    async sendVehicleStatusUpdate(
        customerPhone: string,
        params: VehicleStatusUpdateParams
    ): Promise<SendMessageResponse> {
        const templateId = this.getTemplateId('vehicle_status_update')
        if (!templateId) {
            return {
                messageId: '',
                status: 'failed',
                error: 'No template configured for vehicle status update'
            }
        }

        const paramArray = [
            params.vehicleName,
            params.status,
            params.garageName,
            params.note
        ]

        return this.sendTemplateMessage(customerPhone, templateId, paramArray)
    }

    /** Send a test message to verify configuration */
    async sendTestMessage(testPhone: string): Promise<SendMessageResponse> {
        return this.sendVehicleStatusUpdate(testPhone, {
            vehicleName: 'Test Vehicle KA01AB1234',
            status: 'ready for pickup',
            garageName: 'WrenchCloud Test Garage',
            note: 'This is a test message'
        })
    }
}

// Singleton instance
export const gupshupService = new GupshupService()
