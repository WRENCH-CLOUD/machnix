"use client"

import { useState, useEffect } from "react"
import {
    TrendingUp,
    TrendingDown,
    Building2,
    CreditCard,
    Users,
    Car,
    Briefcase,
    AlertTriangle,
    Crown,
    Zap,
    Package,
    RefreshCcw,
    ChevronDown,
    BarChart3,
    Activity,
    DollarSign,
    MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface PlatformStats {
    total_subscriptions_revenue: number
    active_subscriptions: { basic: number; pro: number; enterprise: number }
    total_tenants: number
    mrr: number
    net_profit: number
}

interface TenantBenchmarks {
    total_garage_revenue: number
    total_jobs_processed: number
    total_customers: number
    total_vehicles: number
}

interface TenantUsage {
    tenant_id: string
    tenant_name: string
    tier: string
    subscription_status: string
    revenue: number
    jobs_count: number
    jobs_this_month: number
    customer_count: number
    vehicle_count: number
    staff_count: number
    whatsapp_sent: number
    last_job_date: string | null
    uses_inventory: boolean
    created_at: string
}

interface ChurnDetection {
    idle_tenants: TenantUsage[]
    idle_count: number
    inventory_adoption_rate: number
    pro_tenants_count: number
    pro_using_inventory: number
}

interface Analytics {
    platform_stats: PlatformStats
    tenant_benchmarks: TenantBenchmarks
    individual_tenant_usage: TenantUsage[]
    top_performers: TenantUsage[]
    churn_detection: ChurnDetection
    totalRevenue: number
    revenueByPaymentMethod: Record<string, number>
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toString()
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return 'Never'
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 30) return `${days} days ago`
    return `${Math.floor(days / 30)} months ago`
}

function getTierColor(tier: string) {
    switch (tier) {
        case 'enterprise': return 'text-violet-400 bg-violet-500/10 border-violet-500/20'
        case 'pro': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
        default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
    }
}

function getTierLabel(tier: string) {
    switch (tier) {
        case 'basic': return 'Basic'
        case 'pro': return 'Pro'
        case 'enterprise': return 'Enterprise'
        default: return tier
    }
}

function getTierIcon(tier: string) {
    switch (tier) {
        case 'enterprise': return Crown
        case 'pro': return Zap
        default: return Package
    }
}

// ============================================================================
// COMPONENTS
// ============================================================================

function MetricCard({
    label,
    value,
    icon: Icon,
    trend,
    trendLabel,
    className,
}: {
    label: string
    value: string
    icon: typeof TrendingUp
    trend?: "up" | "down" | "neutral"
    trendLabel?: string
    className?: string
}) {
    return (
        <div className={cn(
            "p-5 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm",
            "hover:border-border transition-all duration-200",
            className
        )}>
            <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                {trend && (
                    <span className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                        trend === "up" ? "text-emerald-400 bg-emerald-500/10" :
                            trend === "down" ? "text-red-400 bg-red-500/10" :
                                "text-zinc-400 bg-zinc-500/10"
                    )}>
                        {trend === "up" ? <TrendingUp className="w-3 h-3" /> :
                            trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
                        {trendLabel}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        </div>
    )
}

function SubscriptionBreakdown({ subs }: { subs: { basic: number; pro: number; enterprise: number } }) {
    const total = subs.basic + subs.pro + subs.enterprise || 1

    const segments = [
        { label: 'Basic', count: subs.basic, color: 'bg-zinc-500', textColor: 'text-zinc-400' },
        { label: 'Pro', count: subs.pro, color: 'bg-blue-500', textColor: 'text-blue-400' },
        { label: 'Enterprise', count: subs.enterprise, color: 'bg-violet-500', textColor: 'text-violet-400' },
    ]

    return (
        <div className="p-5 rounded-xl border border-border/60 bg-card/50">
            <h3 className="text-sm font-semibold text-foreground mb-4">Subscription Distribution</h3>

            {/* Bar */}
            <div className="h-3 rounded-full bg-muted overflow-hidden flex mb-4">
                {segments.map((s) => (
                    <div
                        key={s.label}
                        className={cn(s.color, "transition-all duration-500")}
                        style={{ width: `${(s.count / total) * 100}%` }}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5">
                {segments.map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full", s.color)} />
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                        <span className={cn("text-xs font-bold", s.textColor)}>{s.count}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function TenantLeaderboard({ tenants }: { tenants: TenantUsage[] }) {
    const [sortBy, setSortBy] = useState<'revenue' | 'jobs_count' | 'customer_count'>('revenue')

    const sorted = [...tenants].sort((a, b) => b[sortBy] - a[sortBy])

    return (
        <div className="p-5 rounded-xl border border-border/60 bg-card/50">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Tenant Usage Leaderboard</h3>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="text-xs px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground focus:outline-none"
                >
                    <option value="revenue">By Revenue</option>
                    <option value="jobs_count">By Jobs</option>
                    <option value="customer_count">By Customers</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-muted-foreground border-b border-border/40">
                            <th className="text-left py-2 pr-3 font-medium">#</th>
                            <th className="text-left py-2 pr-3 font-medium">Tenant</th>
                            <th className="text-left py-2 pr-3 font-medium">Tier</th>
                            <th className="text-right py-2 pr-3 font-medium">Revenue</th>
                            <th className="text-right py-2 pr-3 font-medium">Jobs</th>
                            <th className="text-right py-2 pr-3 font-medium">This Month</th>
                            <th className="text-right py-2 pr-3 font-medium">Customers</th>
                            <th className="text-right py-2 pr-3 font-medium">Vehicles</th>
                            <th className="text-right py-2 pr-3 font-medium">Staff</th>
                            <th className="text-right py-2 font-medium">WhatsApp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.slice(0, 15).map((t, i) => {
                            const TierIcon = getTierIcon(t.tier)
                            return (
                                <tr key={t.tenant_id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                                    <td className="py-2.5 pr-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                                    <td className="py-2.5 pr-3">
                                        <span className="font-medium text-foreground">{t.tenant_name}</span>
                                    </td>
                                    <td className="py-2.5 pr-3">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                                            getTierColor(t.tier)
                                        )}>
                                            <TierIcon className="w-3 h-3" />
                                            {getTierLabel(t.tier)}
                                        </span>
                                    </td>
                                    <td className="py-2.5 pr-3 text-right font-mono text-foreground">{formatCurrency(t.revenue)}</td>
                                    <td className="py-2.5 pr-3 text-right text-muted-foreground">{t.jobs_count}</td>
                                    <td className="py-2.5 pr-3 text-right text-muted-foreground">{t.jobs_this_month}</td>
                                    <td className="py-2.5 pr-3 text-right text-muted-foreground">{t.customer_count}</td>
                                    <td className="py-2.5 pr-3 text-right text-muted-foreground">{t.vehicle_count}</td>
                                    <td className="py-2.5 pr-3 text-right text-muted-foreground">{t.staff_count}</td>
                                    <td className="py-2.5 text-right text-muted-foreground">{t.whatsapp_sent}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function AtRiskPanel({ churn }: { churn: ChurnDetection }) {
    return (
        <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">At-Risk Detection</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-card/60 border border-border/40">
                    <p className="text-2xl font-bold text-amber-400">{churn.idle_count}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Idle Tenants (7+ days)</p>
                </div>
                <div className="p-3 rounded-lg bg-card/60 border border-border/40">
                    <p className="text-2xl font-bold text-foreground">{churn.inventory_adoption_rate}%</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pro Inventory Adoption</p>
                </div>
                <div className="p-3 rounded-lg bg-card/60 border border-border/40">
                    <p className="text-2xl font-bold text-foreground">
                        {churn.pro_using_inventory}/{churn.pro_tenants_count}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pro Using Inventory</p>
                </div>
            </div>

            {churn.idle_tenants.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                        Idle Tenants
                    </p>
                    <div className="space-y-1.5">
                        {churn.idle_tenants.slice(0, 5).map((t) => (
                            <div key={t.tenant_id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-card/40">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">{t.tenant_name}</span>
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-full border",
                                        getTierColor(t.tier)
                                    )}>
                                        {getTierLabel(t.tier)}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    Last job: {timeAgo(t.last_job_date)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function PaymentMethodBreakdown({ data }: { data: Record<string, number> }) {
    const methods = [
        { key: 'cash', label: 'Cash', color: 'bg-emerald-500' },
        { key: 'upi', label: 'UPI', color: 'bg-blue-500' },
        { key: 'card', label: 'Card', color: 'bg-purple-500' },
        { key: 'bank_transfer', label: 'Bank Transfer', color: 'bg-orange-500' },
        { key: 'cheque', label: 'Cheque', color: 'bg-zinc-500' },
    ]

    const total = Object.values(data).reduce((sum, v) => sum + v, 0) || 1

    return (
        <div className="p-5 rounded-xl border border-border/60 bg-card/50">
            <h3 className="text-sm font-semibold text-foreground mb-4">Payment Methods</h3>
            <div className="space-y-3">
                {methods.map(({ key, label, color }) => {
                    const value = data[key] || 0
                    const pct = ((value / total) * 100).toFixed(1)
                    return (
                        <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">{label}</span>
                                <span className="text-xs font-medium text-foreground">
                                    {formatCurrency(value)} ({pct}%)
                                </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className={cn(color, "h-full rounded-full transition-all duration-500")} style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadAnalytics = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch('/api/admin/analytics')
            if (!res.ok) throw new Error('Failed to fetch analytics')
            const { analytics } = await res.json()
            setAnalytics(analytics)
        } catch (err) {
            console.error('Failed to load analytics:', err)
            setError('Failed to load analytics data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAnalytics()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                        <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading analytics...</p>
                </div>
            </div>
        )
    }

    if (error || !analytics) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-sm text-muted-foreground">{error || 'No analytics data available'}</p>
                    <button
                        onClick={loadAnalytics}
                        className="text-xs text-primary hover:underline"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    const { platform_stats, tenant_benchmarks, individual_tenant_usage, churn_detection } = analytics

    return (
        <div className="space-y-6">
            {/* Header */}
            {/* <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Revenue Analytics</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Platform-wide metrics across all tenants
                    </p>
                </div>
                <button
                    onClick={loadAnalytics}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh
                </button>
            </div> */}

            {/* ============================================= */}
            {/* A. CORE METRICS (The Money View)              */}
            {/* ============================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Monthly Recurring Revenue"
                    value={formatCurrency(platform_stats.mrr)}
                    icon={DollarSign}
                    trend="up"
                    trendLabel="MRR"
                />
                <MetricCard
                    label="Gross Merchandise Value"
                    value={formatCurrency(tenant_benchmarks.total_garage_revenue)}
                    icon={CreditCard}
                    trend="up"
                    trendLabel="GMV"
                />
                <MetricCard
                    label="Net Profit (Est.)"
                    value={formatCurrency(platform_stats.net_profit)}
                    icon={TrendingUp}
                    trend={platform_stats.net_profit > 0 ? "up" : "down"}
                    trendLabel={platform_stats.net_profit > 0 ? "Profit" : "Loss"}
                />
                <MetricCard
                    label="Total Tenants"
                    value={formatNumber(platform_stats.total_tenants)}
                    icon={Building2}
                />
            </div>

            {/* Subscription Breakdown + Payment Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SubscriptionBreakdown subs={platform_stats.active_subscriptions} />
                <PaymentMethodBreakdown data={analytics.revenueByPaymentMethod} />
            </div>

            {/* ============================================= */}
            {/* B. TENANT BENCHMARKS                          */}
            {/* ============================================= */}
            {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricCard
                    label="Total Jobs Processed"
                    value={formatNumber(tenant_benchmarks.total_jobs_processed)}
                    icon={Briefcase}
                />
                <MetricCard
                    label="Total Customers"
                    value={formatNumber(tenant_benchmarks.total_customers)}
                    icon={Users}
                />
                <MetricCard
                    label="Total Vehicles"
                    value={formatNumber(tenant_benchmarks.total_vehicles)}
                    icon={Car}
                />
                <MetricCard
                    label="Active Subscriptions"
                    value={formatNumber(
                        platform_stats.active_subscriptions.basic +
                        platform_stats.active_subscriptions.pro +
                        platform_stats.active_subscriptions.enterprise
                    )}
                    icon={Activity}
                />
            </div> */}

            {/* ============================================= */}
            {/* C. TENANT USAGE LEADERBOARD                   */}
            {/* ============================================= */}
            <TenantLeaderboard tenants={individual_tenant_usage} />

            {/* ============================================= */}
            {/* D. AT-RISK DETECTION                          */}
            {/* ============================================= */}
            <AtRiskPanel churn={churn_detection} />
        </div>
    )
}
