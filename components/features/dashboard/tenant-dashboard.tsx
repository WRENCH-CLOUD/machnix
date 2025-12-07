"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  CreditCard,
  Receipt,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { AnalyticsService, type TenantAnalytics } from "@/lib/supabase/services/analytics.service"

export function TenantDashboard() {
  const [analytics, setAnalytics] = useState<TenantAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await AnalyticsService.getTenantAnalytics()
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">{error || 'Failed to load analytics'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { revenue, recentPayments, topPaymentMethod, monthlyRevenue, dailyRevenue } = analytics

  // Calculate collection efficiency
  const collectionEfficiency = revenue.totalRevenue > 0 
    ? (revenue.paidAmount / revenue.totalRevenue) * 100 
    : 0

  return (
    <div className="p-6 space-y-6">
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">₹{(revenue.totalRevenue / 100000).toFixed(2)}L</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ₹{(revenue.paidAmount / 100000).toFixed(2)}L collected
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  Pending
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">₹{(revenue.pendingAmount / 100000).toFixed(2)}L</div>
                <div className="text-sm text-muted-foreground">Pending Amount</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {((revenue.pendingAmount / revenue.totalRevenue) * 100).toFixed(1)}% of total
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Today
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">₹{(dailyRevenue / 1000).toFixed(1)}K</div>
                <div className="text-sm text-muted-foreground">Daily Revenue</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ₹{(monthlyRevenue / 100000).toFixed(2)}L this month
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-500" />
                </div>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  {revenue.paymentCount}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">{collectionEfficiency.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Collection Rate</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Avg: ₹{(revenue.averagePaymentValue / 1000).toFixed(1)}K
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment Methods & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Revenue breakdown by payment type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(revenue.revenueByMethod)
              .sort((a, b) => b[1] - a[1])
              .map(([method, amount], index) => {
                const percentage = revenue.totalRevenue > 0 ? (amount / revenue.totalRevenue) * 100 : 0
                const isTop = method === topPaymentMethod

                return (
                  <motion.div
                    key={method}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize font-medium">
                          {method.replace('_', ' ')}
                        </span>
                        {isTop && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            Most Used
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </span>
                        <span className="font-semibold text-emerald-500">
                          ₹{(amount / 100000).toFixed(2)}L
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </motion.div>
                )
              })}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest payment activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No payments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment, index) => (
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
                        <div className="font-medium">
                          {payment.invoice?.invoice_number || 'Payment'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{payment.payment_method}</span>
                          {payment.reference_number && (
                            <>
                              <span>•</span>
                              <span>{payment.reference_number}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald-500">
                        ₹{((payment.amount || 0) / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.payment_date || payment.paid_at || '').toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Collection Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Efficiency</CardTitle>
          <CardDescription>Revenue collection status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Collected</span>
              <span className="text-sm text-emerald-500 font-semibold">
                ₹{(revenue.paidAmount / 100000).toFixed(2)}L
              </span>
            </div>
            <Progress value={collectionEfficiency} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {collectionEfficiency.toFixed(1)}% of ₹{(revenue.totalRevenue / 100000).toFixed(2)}L total revenue
              </span>
              <span className="text-amber-500 font-medium">
                ₹{(revenue.pendingAmount / 100000).toFixed(2)}L pending
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
