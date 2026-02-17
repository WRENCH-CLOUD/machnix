"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { Spinner } from "@/components/ui/spinner"
import {
    Search,
    MoreVertical,
    CreditCard,
    Crown,
    Zap,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Clock,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TenantDetailsDialog } from "@/components/admin/tenant-details-dialog"
import { type TenantWithStats } from "@/modules/tenant"
import { TIER_PRICING, PLAN_DISPLAY } from "@/config/plan-features"

export default function AdminSubscriptionsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedTenant, setSelectedTenant] = useState<TenantWithStats | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Fetch tenants
    const { data: tenants = [], isLoading, error } = useQuery<TenantWithStats[]>({
        queryKey: ["admin-tenants-subscriptions"],
        queryFn: async () => {
            const res = await fetch("/api/admin/tenants")
            if (!res.ok) throw new Error("Failed to fetch tenants")
            const json = await res.json()
            return json.tenants
        },
    })

    // Filter tenants
    const filteredTenants = tenants.filter((tenant) =>
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Calculate stats
    const totalRevenue = tenants.reduce((acc, t) => {
        const price = t.customPrice ?? TIER_PRICING[t.subscription as keyof typeof TIER_PRICING]?.monthly ?? 0
        return acc + price
    }, 0)

    const activeSubscriptions = tenants.filter(t => t.subscriptionStatus === 'active' || t.subscriptionStatus === 'trial').length
    const pastDue = tenants.filter(t => t.subscriptionStatus === 'past_due' || (t.gracePeriodEndsAt && new Date(t.gracePeriodEndsAt) > new Date())).length

    const handleManage = (tenant: TenantWithStats) => {
        setSelectedTenant(tenant)
        setIsDialogOpen(true)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-500'
            case 'trial': return 'bg-blue-500/10 text-blue-500'
            case 'past_due': return 'bg-orange-500/10 text-orange-500'
            case 'canceled': return 'bg-red-500/10 text-red-500'
            default: return 'bg-slate-500/10 text-slate-500'
        }
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">Estimated monthly revenue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSubscriptions}</div>
                        <p className="text-xs text-muted-foreground">Paying or trial accounts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Past Due / Grace</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pastDue}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Revenue/User</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{tenants.length ? Math.round(totalRevenue / tenants.length).toLocaleString('en-IN') : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">ARPU</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Subscriptions</CardTitle>
                            <CardDescription>Manage tenant plans, billing, and limits</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tenants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tenant</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Valid Until</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Usage (Mo)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Spinner className="h-6 w-6 mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No tenants found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTenants.map((tenant) => {
                                    // Ensure subscription is typed correctly as keyof PLAN_DISPLAY
                                    const planKey = (tenant.subscription || 'basic') as keyof typeof PLAN_DISPLAY
                                    const plan = PLAN_DISPLAY[planKey] || PLAN_DISPLAY.basic

                                    return (
                                        <TableRow key={tenant.id}>
                                            <TableCell>
                                                <div className="font-medium">{tenant.name}</div>
                                                <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="flex w-fit items-center gap-1">
                                                    {tenant.subscription === 'enterprise' ? (
                                                        <Crown className="w-3 h-3 text-purple-500" />
                                                    ) : tenant.subscription === 'pro' ? (
                                                        <Zap className="w-3 h-3 text-primary" />
                                                    ) : null}
                                                    {plan.displayName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(tenant.subscriptionStatus)}>
                                                    {tenant.subscriptionStatus}
                                                </Badge>
                                                {tenant.gracePeriodEndsAt && new Date(tenant.gracePeriodEndsAt) > new Date() && (
                                                    <div className="text-[10px] text-orange-500 flex items-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        Grace Period
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {tenant.subscriptionEndAt
                                                    ? new Date(tenant.subscriptionEndAt).toLocaleDateString("en-IN")
                                                    : "—"}
                                            </TableCell>
                                            <TableCell>
                                                ₹{tenant.customPrice ?? TIER_PRICING[planKey]?.monthly ?? 0}/mo
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs space-y-1">
                                                    <div className="flex justify-between w-24">
                                                        <span>Jobs:</span>
                                                        <span className="font-medium">{tenant.jobs_this_month || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between w-24">
                                                        <span>Staff:</span>
                                                        <span className="font-medium">{tenant.staff_count || 0}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleManage(tenant)}>
                                                            <CreditCard className="w-4 h-4 mr-2" />
                                                            Manage Subscription
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <TenantDetailsDialog
                tenant={selectedTenant}
                loading={false}
                error={null}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </div>
    )
}
