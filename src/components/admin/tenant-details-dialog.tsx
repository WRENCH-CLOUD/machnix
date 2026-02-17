"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { type TenantWithStats } from "@/modules/tenant"
import {
  Building2,
  Users,
  Wrench,
  DollarSign,
  Calendar,
  CheckCircle2,
  Activity,
} from "lucide-react"
import { SubscriptionManagementPanel } from "./subscription-management-panel"

interface TenantDetailsDialogProps {
  tenant: TenantWithStats | null
  loading: boolean
  error: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TenantDetailsDialog({ tenant, loading, error, open, onOpenChange }: TenantDetailsDialogProps) {
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

  const safeStatus = ((tenant && tenant.status) || "active") as string
  const safeSubscription = ((tenant && tenant.subscription) || "pro") as string

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            {loading ? "Loading..." : tenant?.name || "Tenant Details"}
          </DialogTitle>
          <DialogDescription>Comprehensive tenant information and statistics</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : tenant ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{tenant.name}</h3>
                {tenant.slug && (
                  <p className="text-sm text-muted-foreground">Slug: {tenant.slug}</p>
                )}
                {tenant.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Created{" "}
                      {new Date(tenant.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant="outline"
                  className={statusColors[safeStatus] || statusColors.active}
                >
                  {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
                </Badge>
                <Badge className={subscriptionColors[safeSubscription] || subscriptionColors.pro}>
                  {safeSubscription.charAt(0).toUpperCase() + safeSubscription.slice(1)} Plan
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{tenant.customer_count || 0}</div>
                  <div className="text-xs text-muted-foreground">Customers</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{tenant.active_jobs || 0}</div>
                  <div className="text-xs text-muted-foreground">Active Jobs</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{tenant.completed_jobs || 0}</div>
                  <div className="text-xs text-muted-foreground">Completed Jobs</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-purple-500" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{tenant.mechanic_count || 0}</div>
                  <div className="text-xs text-muted-foreground">Mechanics</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="text-2xl font-bold text-emerald-500">
                      ₹{((tenant.total_revenue || 0) / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Revenue per Job</span>
                    <span className="font-medium">
                      ₹
                      {tenant.completed_jobs
                        ? Math.round((tenant.total_revenue || 0) / tenant.completed_jobs).toLocaleString(
                          "en-IN",
                        )
                        : "0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Revenue per Customer</span>
                    <span className="font-medium">
                      ₹
                      {tenant.customer_count
                        ? Math.round((tenant.total_revenue || 0) / tenant.customer_count).toLocaleString(
                          "en-IN",
                        )
                        : "0"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Subscription Management */}
            <SubscriptionManagementPanel
              tenantId={tenant.id}
              tenantName={tenant.name}
            />
          </div>
        ) : (
          <p className="text-muted-foreground">No tenant data available</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
