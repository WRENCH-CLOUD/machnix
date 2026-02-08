import { env } from '@/lib/env'

export type WhatsAppTemplateType = 'vehicle_status_update'

/** Job status to display text mapping */
export const STATUS_DISPLAY_TEXT: Record<string, string> = {
    received: 'RECEIVED YOUR VEHICLE',
    working: 'WORK ON THE VEHICLE STARTED',
    ready: 'VEHICLE READY FOR DELIVERY',
    completed: 'DELIVERED SUCCESSFULLY',
}

export interface VehicleStatusParams {
    /** Job status: received, working, ready, completed */
    jobStatus: string
    /** Vehicle registration number */
    vehicleNumber: string
    /** Tenant garage name */
    garageName: string
    /** Custom note (manual for received, auto for others) */
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
 * Template: {{1}} status, {{2}} vehicle, {{3}} garage, {{4}} note
 */
export class GupshupService {
    private readonly templateApiUrl = 'https://api.gupshup.io/wa/api/v1/template/msg'

    isConfigured(): boolean {
        return env.hasGupshupConfig
    }

    getSourceNumber(): string | undefined {
        return env.GUPSHUP_SOURCE_NUMBER
    }

    private getTemplateId(templateType: WhatsAppTemplateType): string | undefined {
        const templateMap: Record<WhatsAppTemplateType, string | undefined> = {
            vehicle_status_update: env.GUPSHUP_TEMPLATE_VEHICLE_STATUS,
        }
        return templateMap[templateType]
    }

    private formatPhoneNumber(phone: string): string {
        let cleaned = phone.replace(/\D/g, '')
        if (cleaned.length === 10) {
            cleaned = '91' + cleaned
        }
        return cleaned
    }

    async sendTemplateMessage(
        destination: string,
        templateId: string,
        params: string[]
    ): Promise<SendMessageResponse> {
        if (!this.isConfigured()) {
            return {
                messageId: '',
                status: 'failed',
                error: 'Gupshup is not configured'
            }
        }

        const sourceNumber = this.getSourceNumber()
        if (!sourceNumber) {
            return { messageId: '', status: 'failed', error: 'No source number configured' }
        }

        const templatePayload = JSON.stringify({ id: templateId, params })
        const body = new URLSearchParams({
            channel: 'whatsapp',
            source: sourceNumber,
            destination: this.formatPhoneNumber(destination),
            'src.name': env.GUPSHUP_APP_NAME!,
            template: templatePayload,
        })

        console.log('[GupshupService] Request payload:', {
            url: this.templateApiUrl,
            source: sourceNumber,
            destination: this.formatPhoneNumber(destination),
            appName: env.GUPSHUP_APP_NAME,
            template: templatePayload,
        })

        try {
            const response = await fetch(this.templateApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'apikey': env.GUPSHUP_API_KEY!,
                },
                body: body.toString(),
            })

            const data = await response.json()

            console.log('[GupshupService] API Response:', {
                status: response.status,
                data,
            })

            if (!response.ok || data.status === 'error') {
                console.error('[GupshupService] API error:', data)
                return { messageId: '', status: 'failed', error: data.message || 'API request failed' }
            }

            return { messageId: data.messageId || '', status: 'submitted' }
        } catch (error) {
            console.error('[GupshupService] Failed to send:', error)
            return {
                messageId: '',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Send vehicle status update
     * 
     * Template params:
     * {{1}} = Status text (RECEIVED YOUR VEHICLE, etc)
     * {{2}} = Vehicle number
     * {{3}} = Garage name
     * {{4}} = Note
     */
    async sendVehicleStatusUpdate(
        customerPhone: string,
        params: VehicleStatusParams
    ): Promise<SendMessageResponse> {
        const templateId = this.getTemplateId('vehicle_status_update')
        if (!templateId) {
            return { messageId: '', status: 'failed', error: 'No template configured' }
        }

        const statusText = STATUS_DISPLAY_TEXT[params.jobStatus] || params.jobStatus.toUpperCase()

        const paramArray = [
            statusText,           // {{1}} - Status display text
            params.vehicleNumber, // {{2}} - Vehicle number
            params.garageName,    // {{3}} - Garage name
            params.note           // {{4}} - Note
        ]

        return this.sendTemplateMessage(customerPhone, templateId, paramArray)
    }

    async sendTestMessage(testPhone: string): Promise<SendMessageResponse> {
        return this.sendVehicleStatusUpdate(testPhone, {
            jobStatus: 'received',
            vehicleNumber: 'KA01AB1234',
            garageName: 'WrenchCloud Test Garage',
            note: 'This is a test message'
        })
    }
}

export const gupshupService = new GupshupService()
