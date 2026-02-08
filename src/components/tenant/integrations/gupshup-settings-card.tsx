"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Check, AlertCircle, Loader2, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface GupshupSettingsCardProps {
    className?: string
}

interface SettingsResponse {
    whatsappEnabled: boolean
    platformConfigured: boolean
    sourceNumber: string | null
}

export function GupshupSettingsCard({ className }: GupshupSettingsCardProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [platformConfigured, setPlatformConfigured] = useState(false)
    const [sourceNumber, setSourceNumber] = useState<string | null>(null)
    const [whatsappEnabled, setWhatsappEnabled] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings(): Promise<void> {
        setLoading(true)
        const res = await fetch("/api/tenant/gupshup")

        if (!res.ok) {
            toast.error("Failed to load WhatsApp settings")
            setLoading(false)
            return
        }

        const data = await res.json() as SettingsResponse
        setPlatformConfigured(data.platformConfigured)
        setSourceNumber(data.sourceNumber)
        setWhatsappEnabled(data.whatsappEnabled)
        setLoading(false)
    }

    async function handleSave(): Promise<void> {
        setSaving(true)
        const res = await fetch("/api/tenant/gupshup", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ whatsappEnabled }),
        })

        if (!res.ok) {
            const error = await res.json()
            toast.error(error.error || "Failed to save settings")
        } else {
            toast.success("WhatsApp settings saved")
            await fetchSettings()
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (!platformConfigured) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        WhatsApp Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">
                            WhatsApp integration is not configured. Contact support to enable.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp Notifications
                </CardTitle>
                <CardDescription>
                    Send WhatsApp updates to customers when you choose
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium">WrenchCloud WhatsApp</p>
                        <p className="text-sm text-muted-foreground">
                            Messages sent from official WrenchCloud number
                            {sourceNumber && <span className="font-mono ml-1">+{sourceNumber}</span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Enable WhatsApp Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            Allow sending status updates to customers via WhatsApp
                        </p>
                    </div>
                    <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Save Settings
                        </>
                    )}
                </Button>

                {whatsappEnabled && (
                    <div className="pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            When enabled, you&apos;ll see a &quot;Send WhatsApp&quot; button on job details
                            to manually notify customers about their vehicle status.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
