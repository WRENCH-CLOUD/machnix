"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Check, AlertCircle, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface GupshupSettingsCardProps {
    className?: string;
}

export function GupshupSettingsCard({ className }: GupshupSettingsCardProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [platformConfigured, setPlatformConfigured] = useState(false);
    const [sourceNumber, setSourceNumber] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/tenant/gupshup");
            const data = await res.json();

            setPlatformConfigured(data.platformConfigured);
            setSourceNumber(data.sourceNumber || null);

            if (data.settings) {
                setIsActive(data.settings.isActive || false);
            }
        } catch (error) {
            console.error("Failed to fetch Gupshup settings:", error);
            toast.error("Failed to load WhatsApp settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await fetch("/api/tenant/gupshup", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save settings");
            }

            toast.success("WhatsApp settings saved successfully");
            await fetchSettings();
        } catch (error: any) {
            toast.error(error.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
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
                            WhatsApp integration is not configured at the platform level.
                            Please contact support to enable this feature.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
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
                {/* Platform Number Info */}
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium">WrenchCloud WhatsApp</p>
                        <p className="text-sm text-muted-foreground">
                            Messages will be sent from the official WrenchCloud number
                            {sourceNumber && (
                                <span className="font-mono ml-1">+{sourceNumber}</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Enable Toggle */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Enable WhatsApp Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            Allow sending status updates to customers via WhatsApp
                        </p>
                    </div>
                    <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                    />
                </div>

                {/* Save Button */}
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

                {/* Usage Info */}
                {isActive && (
                    <div className="pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            Once enabled, you&apos;ll see a &quot;Send WhatsApp&quot; button on job
                            details to manually notify customers about their vehicle status.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
