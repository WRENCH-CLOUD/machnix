"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ClipboardList, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export interface DashboardStats {
  customer_count: number;
  active_jobs: number;
  completed_jobs: number;
  mechanic_count: number;
  total_revenue: number;
  // Insights data
  pending_jobs?: number;  // Jobs in 'received' status waiting to be worked
  ready_jobs?: number;    // Jobs in 'ready' status waiting for payment/pickup
  jobs_this_week?: number;  // Jobs created this week
  recentJobs?: Array<{
    id: string;
    customer: string;
    vehicle: string;
    status: string;
    priority: string;
  }>;
}

export function TenantDashboard({ stats: dynamicStats }: { stats?: DashboardStats }) {
  const stats = [
    {
      title: "Active Jobs",
      value: dynamicStats?.active_jobs.toString() || "0",
      change: "Currently in progress",
      icon: ClipboardList,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Customers",
      value: dynamicStats?.customer_count.toString() || "0",
      change: "All registered customers",
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Revenue (MTD)",
      value: dynamicStats ? `₹${dynamicStats.total_revenue.toLocaleString()}` : "₹0",
      change: "Total revenue generated",
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Mechanics",
      value: dynamicStats?.mechanic_count.toString() || "0",
      change: "Active mechanics",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  const recentJobs = dynamicStats?.recentJobs || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "received":
        return <Badge variant="outline">Received</Badge>;
      case "working":
        return <Badge variant="default">Working</Badge>;
      case "ready":
        return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Ready</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate pr-2">
                {stat.title}
              </CardTitle>
              <div className={`p-1.5 md:p-2 rounded-lg ${stat.bg} flex-shrink-0`}>
                <stat.icon className={`w-3 h-3 md:w-4 md:h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold truncate">{stat.value}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1 truncate">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {/* Recent Jobs */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base md:text-lg">Recent Jobs</CardTitle>
                <CardDescription className="text-xs md:text-sm truncate">Latest service requests and ongoing repairs</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 flex-shrink-0 text-xs">
                <Calendar className="w-3 h-3" />
                <span className="hidden sm:inline">Today</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 md:p-4 lg:p-6 pt-0">
            <div className="relative w-full overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[500px]" aria-label="Recent Jobs">
                <thead className="text-xs text-muted-foreground uppercase border-b border-border/50">
                  <tr>
                    <th className="px-3 md:px-4 py-2 md:py-3 font-medium">Job ID</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 font-medium">Customer</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 font-medium">Vehicle</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="px-3 md:px-4 py-2 md:py-3 font-medium text-primary whitespace-nowrap">{job.id}</td>
                      <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap">{job.customer}</td>
                      <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap">{job.vehicle}</td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-right">
                        {getStatusBadge(job.status)}
                      </td>
                    </tr>
                  ))}
                  {recentJobs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8">
                        <Empty>
                          <EmptyMedia variant="icon">
                            <ClipboardList className="size-6" />
                          </EmptyMedia>
                          <EmptyContent>
                            <EmptyTitle>No recent jobs</EmptyTitle>
                            <EmptyDescription>
                              New jobs will appear here once created.
                            </EmptyDescription>
                          </EmptyContent>
                        </Empty>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Notifications */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardDescription>Key metrics for your garage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pending Jobs Alert */}
            {(dynamicStats?.pending_jobs ?? 0) > 0 && (
              <div className="flex gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <div className="text-sm font-medium">{dynamicStats?.pending_jobs} Jobs Pending</div>
                  <div className="text-xs text-muted-foreground">Waiting to be assigned or started</div>
                </div>
              </div>
            )}
            
            {/* Ready for Pickup */}
            {(dynamicStats?.ready_jobs ?? 0) > 0 && (
              <div className="flex gap-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <div className="text-sm font-medium">{dynamicStats?.ready_jobs} Ready for Pickup</div>
                  <div className="text-xs text-muted-foreground">Vehicles ready for customer collection</div>
                </div>
              </div>
            )}

            {/* Weekly Summary */}
            <div className="pt-4">
              <div className="text-sm font-medium mb-3">Weekly Overview</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Jobs This Week</span>
                  <span className="text-sm font-medium">{dynamicStats?.jobs_this_week ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Active Jobs</span>
                  <span className="text-sm font-medium">{dynamicStats?.active_jobs ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Completed Jobs</span>
                  <span className="text-sm font-medium">{dynamicStats?.completed_jobs ?? 0}</span>
                </div>
              </div>
            </div>

            {/* No alerts state */}
            {(dynamicStats?.pending_jobs ?? 0) === 0 && (dynamicStats?.ready_jobs ?? 0) === 0 && (
              <div className="flex gap-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <div className="text-sm font-medium">All Clear</div>
                  <div className="text-xs text-muted-foreground">No pending jobs or vehicles waiting</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
