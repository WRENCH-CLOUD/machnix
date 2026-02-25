"use client"

import { motion } from "framer-motion"
import {
  Building2,
  DollarSign,
  Wrench,
  Users,
  TrendingUp,
  MoreHorizontal,
  Search,
  LogIn,
  Eye,
  RefreshCw,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { type GlobalAnalytics } from "@/modules/analytics"

import { type TenantWithStats } from "@/modules/tenant"

interface OverviewViewProps {
  tenants: TenantWithStats[]
  loading: boolean
  error: string | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
  onViewDetails: (tenantId: string) => void
  globalAnalytics?: GlobalAnalytics | null
  analyticsLoading: boolean
}

export function OverviewView({
  tenants,
  loading,
  error,
  searchQuery,
  onSearchChange,
  onRefresh,
  onViewDetails,
  globalAnalytics,
  analyticsLoading,
}: OverviewViewProps) {
  const globalStats = {
    activeTenants: tenants.filter((t) => t.status === "active").length,
    totalRevenue: tenants.reduce((sum, t) => sum + (t.total_revenue || 0), 0),
    totalJobs: tenants.reduce((sum, t) => sum + (t.completed_jobs || 0) + (t.active_jobs || 0), 0),
    totalMechanics: tenants.reduce((sum, t) => sum + (t.mechanic_count || 0), 0),
  }

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    suspended: "bg-red-500/10 text-red-500 border-red-500/20",
    trial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  }

  const subscriptionColors: Record<string, string> = {
    basic: "bg-slate-500/10 text-slate-400",
    pro: "bg-primary/10 text-primary",
    enterprise: "bg-purple-500/10 text-purple-500",
  }

  return (
    <>
      {/* Global Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            title: "Active Garages",
            value: globalStats.activeTenants,
            icon: Building2,
            color: "text-primary",
            bgColor: "bg-primary/10",
            change: `${globalAnalytics?.activeTenants || 0} with payments`,
          },
          {
            title: "Total Revenue",
            value: globalAnalytics
              ? `₹${(globalAnalytics.totalRevenue / 100000).toFixed(1)}L`
              : `₹${(globalStats.totalRevenue / 100000).toFixed(1)}L`,
            icon: DollarSign,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            change: `${globalAnalytics?.totalPayments || 0} payments`,
          },
          {
            title: "Jobs Processed",
            value: globalStats.totalJobs.toLocaleString("en-IN"),
            icon: Wrench,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
            change: "All time",
          },
          {
            title: "Total Mechanics",
            value: globalStats.totalMechanics,
            icon: Users,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            change: "Active on platform",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.change}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tenant Overview Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tenant Overview</CardTitle>
              <CardDescription>All registered garages on the platform</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={onRefresh} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Building2 className="w-12 h-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {searchQuery ? "No tenants found matching your search" : "No tenants registered yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Job Stats</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Mechanics</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant, index) => {
                  const totalJobs = (tenant.active_jobs || 0) + (tenant.completed_jobs || 0)
                  const completionRate = totalJobs > 0 ? ((tenant.completed_jobs || 0) / totalJobs) * 100 : 0

                  return (
                    <motion.tr
                      key={tenant.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{tenant.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Since{" "}
                              {new Date(tenant.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[tenant.status || "active"]}>
                          {(tenant.status || "active").charAt(0).toUpperCase() +
                            (tenant.status || "active").slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={subscriptionColors[tenant.subscription || "pro"]}>
                          {(tenant.subscription || "pro").charAt(0).toUpperCase() +
                            (tenant.subscription || "pro").slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{tenant.customer_count || 0}</div>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{tenant.active_jobs || 0} active</span>
                            <span className="text-muted-foreground">{tenant.completed_jobs || 0} done</span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-emerald-500">
                          ₹{((tenant.total_revenue || 0) / 100000).toFixed(1)}L
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{tenant.mechanic_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewDetails(tenant.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <LogIn className="w-4 h-4 mr-2" />
                              Login as Tenant
                            </DropdownMenuItem>
                            <DropdownMenuItem>Manage Subscription</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest payment activity across all garages</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="w-6 h-6" />
              </div>
            ) : globalAnalytics?.recentPayments && globalAnalytics.recentPayments.length > 0 ? (
              <div className="space-y-3">
                {globalAnalytics.recentPayments.slice(0, 5).map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <div className="font-medium">{payment.tenant_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {payment.invoice?.invoice_number || "N/A"} • {payment.payment_method}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald-500">
                        ₹{((payment.amount || 0) / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(payment.payment_date || payment.paid_at || "").toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <DollarSign className="w-10 h-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No payments yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Payment Method</CardTitle>
            <CardDescription>Payment method breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="w-6 h-6" />
              </div>
            ) : globalAnalytics?.revenueByPaymentMethod ? (
              <div className="space-y-3">
                {Object.entries(globalAnalytics.revenueByPaymentMethod)
                  .sort((a, b) => b[1] - a[1])
                  .map(([method, amount], index) => {
                    const total = Object.values(globalAnalytics.revenueByPaymentMethod).reduce(
                      (sum, val) => sum + val,
                      0
                    )
                    const percentage = total > 0 ? (amount / total) * 100 : 0

                    return (
                      <motion.div
                        key={method}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize font-medium">{method.replace("_", " ")}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                            <span className="font-semibold text-emerald-500">
                              ₹{(amount / 100000).toFixed(1)}L
                            </span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </motion.div>
                    )
                  })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <BarChart3 className="w-10 h-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No payment data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
