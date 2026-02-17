"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    CreditCard,
    TrendingUp,
    Calendar,
    AlertTriangle,
    Plus,
    RefreshCw,
    Clock,
    IndianRupee,
    Shield,
    Zap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
    TIER_LIMITS,
    TIER_PRICING,
    type SubscriptionTier,
} from "@/config/plan-features"

interface SubscriptionData {
    tier: SubscriptionTier
    status: string
    validity: string
    billingPeriod: string
    startAt: string | null
    endAt: string | null
    gracePeriodEndsAt: string | null
    trialEndsAt: string | null
    customPrice: number | null
    isActive: boolean
    isInGracePeriod: boolean
    isExpired: boolean
    daysUntilExpiry: number | null
    limits: Record<string, number>
    pricing: { monthly: number; annual: number }
    usage: {
        jobsThisMonth: number
        whatsappThisMonth: number
        staffCount: number
        inventoryCount: number
    }
    overrides: any[]
    allOverrides: any[]
    invoices: any[]
}

interface SubscriptionManagementPanelProps {
    tenantId: string
    tenantName: string
}

export function SubscriptionManagementPanel({
    tenantId,
    tenantName,
}: SubscriptionManagementPanelProps) {
    const [data, setData] = useState<SubscriptionData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [addingOverride, setAddingOverride] = useState(false)
    const { toast } = useToast()

    // Override form state
    const [overrideFeatureKey, setOverrideFeatureKey] = useState("")
    const [overrideQuantity, setOverrideQuantity] = useState("")
    const [overrideExpiresAt, setOverrideExpiresAt] = useState("")
    const [overrideReason, setOverrideReason] = useState("")

    // Subscription edit state
    const [editingSubscription, setEditingSubscription] = useState(false)
    const [editTier, setEditTier] = useState<string>("")
    const [editEndAt, setEditEndAt] = useState("")
    const [editCustomPrice, setEditCustomPrice] = useState("")
    const [editBillingPeriod, setEditBillingPeriod] = useState("")

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch(`/api/admin/tenants/${tenantId}/subscription`)
            if (!res.ok) throw new Error("Failed to fetch subscription data")
            const json = await res.json()
            setData(json.subscription)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load")
        } finally {
            setLoading(false)
        }
    }, [tenantId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleUpdateSubscription = async () => {
        try {
            setSaving(true)
            const updates: Record<string, unknown> = {}
            if (editTier) updates.tier = editTier
            if (editEndAt) updates.endAt = new Date(editEndAt).toISOString()
            if (editCustomPrice) updates.customPrice = Number(editCustomPrice)
            if (editBillingPeriod) updates.billingPeriod = editBillingPeriod

            const res = await fetch(`/api/admin/tenants/${tenantId}/subscription`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to update")
            }

            toast({ title: "Subscription updated", description: `${tenantName}'s subscription has been updated.` })
            setEditingSubscription(false)
            fetchData()
        } catch (err) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Update failed",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleAddOverride = async () => {
        if (!overrideFeatureKey.trim() || !overrideQuantity) return
        try {
            setAddingOverride(true)
            const res = await fetch(`/api/admin/tenants/${tenantId}/overrides`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    featureKey: overrideFeatureKey.trim(),
                    quantity: Number(overrideQuantity),
                    expiresAt: overrideExpiresAt || null,
                    reason: overrideReason.trim() || null,
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to add override")
            }

            toast({ title: "Override added", description: `+${overrideQuantity} ${overrideFeatureKey} for ${tenantName}` })
            setOverrideFeatureKey("")
            setOverrideQuantity("")
            setOverrideExpiresAt("")
            setOverrideReason("")
            fetchData()
        } catch (err) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed",
                variant: "destructive",
            })
        } finally {
            setAddingOverride(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner className="w-8 h-8" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="text-center py-8 space-y-3">
                <p className="text-destructive">{error || "No data"}</p>
                <Button onClick={fetchData} variant="outline" size="sm">
                    Retry
                </Button>
            </div>
        )
    }

    // Usage bar helpers
    const usageMetrics = [
        {
            label: "Jobs (this month)",
            current: data.usage.jobsThisMonth,
            limit: data.limits.jobsPerMonth,
            overrideExtra: data.overrides
                .filter((o: any) => o.featureKey === "extra_jobs")
                .reduce((s: number, o: any) => s + o.quantity, 0),
            icon: Zap,
            color: "bg-primary",
        },
        {
            label: "Staff",
            current: data.usage.staffCount,
            limit: data.limits.staffCount,
            overrideExtra: data.overrides
                .filter((o: any) => o.featureKey === "extra_staff")
                .reduce((s: number, o: any) => s + o.quantity, 0),
            icon: Shield,
            color: "bg-amber-500",
        },
        {
            label: "WhatsApp (this month)",
            current: data.usage.whatsappThisMonth,
            limit: data.limits.whatsappMessages,
            overrideExtra: data.overrides
                .filter((o: any) => o.featureKey === "extra_whatsapp")
                .reduce((s: number, o: any) => s + o.quantity, 0),
            icon: TrendingUp,
            color: "bg-emerald-500",
        },
    ]

    const validityColors: Record<string, string> = {
        active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        trial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        grace_period: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        expired: "bg-red-500/10 text-red-500 border-red-500/20",
    }

    return (
        <div className="space-y-6">
            {/* Subscription Status Header */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Subscription</CardTitle>
                                <CardDescription>
                                    {data.tier.charAt(0).toUpperCase() + data.tier.slice(1)} Plan •
                                    ₹{data.customPrice ?? data.pricing.monthly}/mo
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={validityColors[data.validity] || validityColors.active}
                            >
                                {data.validity === "grace_period"
                                    ? "Grace Period"
                                    : data.validity.charAt(0).toUpperCase() + data.validity.slice(1)}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={fetchData}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Period</span>
                            <p className="font-medium">{data.billingPeriod}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Started</span>
                            <p className="font-medium">
                                {data.startAt
                                    ? new Date(data.startAt).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })
                                    : "—"}
                            </p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Expires</span>
                            <p className="font-medium">
                                {data.endAt
                                    ? new Date(data.endAt).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })
                                    : "—"}
                            </p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Days Left</span>
                            <p className="font-medium">
                                {data.daysUntilExpiry !== null ? `${data.daysUntilExpiry} days` : "—"}
                            </p>
                        </div>
                    </div>

                    {data.isInGracePeriod && (
                        <div className="mt-4 flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg text-orange-600 text-sm">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>
                                Grace period active until{" "}
                                {data.gracePeriodEndsAt
                                    ? new Date(data.gracePeriodEndsAt).toLocaleDateString("en-IN")
                                    : "unknown"}
                            </span>
                        </div>
                    )}

                    <div className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setEditTier(data.tier)
                                setEditEndAt(
                                    data.endAt
                                        ? new Date(data.endAt).toISOString().slice(0, 10)
                                        : ""
                                )
                                setEditCustomPrice(data.customPrice?.toString() || "")
                                setEditBillingPeriod(data.billingPeriod)
                                setEditingSubscription(true)
                            }}
                        >
                            Edit Subscription
                        </Button>
                    </div>

                    {editingSubscription && (
                        <div className="mt-4 p-4 border rounded-lg space-y-4 bg-muted/30">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Tier</Label>
                                    <Select value={editTier} onValueChange={setEditTier}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">Basic (₹{TIER_PRICING.basic.monthly}/mo)</SelectItem>
                                            <SelectItem value="pro">Pro (₹{TIER_PRICING.pro.monthly}/mo)</SelectItem>
                                            <SelectItem value="enterprise">Enterprise (₹{TIER_PRICING.enterprise.monthly}+/mo)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Billing Period</Label>
                                    <Select value={editBillingPeriod} onValueChange={setEditBillingPeriod}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Expires At</Label>
                                    <Input
                                        type="date"
                                        value={editEndAt}
                                        onChange={(e) => setEditEndAt(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Custom Price (₹/mo)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Leave empty for default"
                                        value={editCustomPrice}
                                        onChange={(e) => setEditCustomPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleUpdateSubscription} disabled={saving}>
                                    {saving ? <Spinner className="w-4 h-4 mr-2" /> : null}
                                    Save Changes
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingSubscription(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Usage Progress Bars */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Usage
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {usageMetrics.map((metric) => {
                        const effectiveLimit =
                            metric.limit === -1
                                ? Infinity
                                : metric.limit + metric.overrideExtra
                        const percent =
                            effectiveLimit === Infinity
                                ? 0
                                : effectiveLimit > 0
                                    ? Math.min(100, (metric.current / effectiveLimit) * 100)
                                    : 0
                        const isNearLimit = percent >= 80
                        const isAtLimit = percent >= 100

                        return (
                            <div key={metric.label}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <metric.icon className="w-4 h-4 text-muted-foreground" />
                                        <span>{metric.label}</span>
                                    </div>
                                    <span className="text-sm font-medium">
                                        {metric.current} /{" "}
                                        {metric.limit === -1
                                            ? "∞"
                                            : effectiveLimit}
                                        {metric.overrideExtra > 0 && (
                                            <span className="text-xs text-emerald-500 ml-1">
                                                (+{metric.overrideExtra})
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <Progress
                                    value={metric.limit === -1 ? 0 : percent}
                                    className={`h-2 ${isAtLimit
                                            ? "[&>div]:bg-red-500"
                                            : isNearLimit
                                                ? "[&>div]:bg-amber-500"
                                                : ""
                                        }`}
                                />
                                {metric.limit === -1 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Unlimited (Enterprise PAYG)
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {/* Add Override */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Override / Top-up
                    </CardTitle>
                    <CardDescription>
                        Grant extra capacity or extend access for this tenant
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Feature Key</Label>
                            <Input
                                placeholder="e.g. extra_jobs, extra_whatsapp, custom_feature"
                                value={overrideFeatureKey}
                                onChange={(e) => setOverrideFeatureKey(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 50"
                                value={overrideQuantity}
                                onChange={(e) => setOverrideQuantity(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Expires At (optional)</Label>
                            <Input
                                type="date"
                                value={overrideExpiresAt}
                                onChange={(e) => setOverrideExpiresAt(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Reason (optional)</Label>
                            <Input
                                placeholder="e.g. Retention bonus, Trial extension"
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button
                        className="mt-4 gap-2"
                        size="sm"
                        onClick={handleAddOverride}
                        disabled={addingOverride || !overrideFeatureKey.trim() || !overrideQuantity}
                    >
                        {addingOverride ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        Add Override
                    </Button>
                </CardContent>
            </Card>

            {/* Active Overrides */}
            {data.overrides.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Active Overrides</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.overrides.map((o: any) => (
                                <div
                                    key={o.id}
                                    className="flex items-center justify-between p-3 rounded-lg border text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge variant="secondary">{o.featureKey}</Badge>
                                        <span className="font-medium">+{o.quantity}</span>
                                        {o.reason && (
                                            <span className="text-muted-foreground">— {o.reason}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                        <Clock className="w-3 h-3" />
                                        {o.expiresAt
                                            ? `Expires ${new Date(o.expiresAt).toLocaleDateString("en-IN")}`
                                            : "No expiry"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Billing History */}
            {data.invoices.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <IndianRupee className="w-4 h-4" />
                            Billing History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.invoices.map((inv: any) => (
                                <div
                                    key={inv.id}
                                    className="flex items-center justify-between p-3 rounded-lg border text-sm"
                                >
                                    <div>
                                        <span className="font-medium">{inv.description || inv.invoiceType}</span>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(inv.createdAt).toLocaleDateString("en-IN")} •{" "}
                                            {inv.paymentMethod || "manual"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium">₹{inv.totalAmount}</span>
                                        <Badge
                                            variant="outline"
                                            className={
                                                inv.status === "paid"
                                                    ? "bg-emerald-500/10 text-emerald-500"
                                                    : inv.status === "cancelled"
                                                        ? "bg-red-500/10 text-red-500"
                                                        : "bg-amber-500/10 text-amber-500"
                                            }
                                        >
                                            {inv.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
