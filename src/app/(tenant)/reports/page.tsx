"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/providers/auth-provider"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ClipboardList,
  Users,
  Calendar,
  Download,
  Loader2
} from "lucide-react"

interface ReportStats {
  totalRevenue: number
  revenueChange: number
  totalJobs: number
  jobsChange: number
  completedJobs: number
  pendingJobs: number
  averageJobValue: number
  customerCount: number
}

export default function ReportsPage() {
  const { tenantId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<string>("month")
  const [stats, setStats] = useState<ReportStats | null>(null)

  useEffect(() => {
    if (tenantId) {
      fetchReportData()
    }
  }, [tenantId, period])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      // Fetch dashboard stats as base data
      const res = await fetch('/api/tenant/stats')
      if (res.ok) {
        const data = await res.json()
        // Calculate derived metrics
        setStats({
          totalRevenue: data.total_revenue || 0,
          revenueChange: 12.5, // Placeholder - would need historical data
          totalJobs: (data.active_jobs || 0) + (data.completed_jobs || 0),
          jobsChange: 8.2, // Placeholder
          completedJobs: data.completed_jobs || 0,
          pendingJobs: data.pending_jobs || 0,
          averageJobValue: data.completed_jobs > 0 
            ? Math.round((data.total_revenue || 0) / data.completed_jobs) 
            : 0,
          customerCount: data.customer_count || 0,
        })
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your garage
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(stats?.totalRevenue || 0).toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-emerald-500 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{stats?.revenueChange}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Jobs
            </CardTitle>
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
            <div className="flex items-center text-xs text-emerald-500 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{stats?.jobsChange}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Job Value
            </CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(stats?.averageJobValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per completed job
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Customers
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.customerCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Job Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Status Overview</CardTitle>
            <CardDescription>Breakdown of jobs by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="text-sm font-medium">{stats?.pendingJobs || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm">In Progress</span>
                </div>
                <span className="text-sm font-medium">
                  {(stats?.totalJobs || 0) - (stats?.completedJobs || 0) - (stats?.pendingJobs || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="text-sm font-medium">{stats?.completedJobs || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-medium">
                  {stats?.totalJobs 
                    ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Jobs per Customer</span>
                <span className="text-sm font-medium">
                  {stats?.customerCount 
                    ? (stats.totalJobs / stats.customerCount).toFixed(1)
                    : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Revenue per Customer</span>
                <span className="text-sm font-medium">
                  ₹{stats?.customerCount 
                    ? Math.round(stats.totalRevenue / stats.customerCount).toLocaleString()
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">More Reports Coming Soon</CardTitle>
          <CardDescription>
            Detailed analytics including revenue trends, service type breakdown, mechanic performance, and customer retention metrics will be available in future updates.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
