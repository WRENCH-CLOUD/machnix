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

export interface DashboardStats {
  customer_count: number;
  active_jobs: number;
  completed_jobs: number;
  mechanic_count: number;
  total_revenue: number;
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
        return <Badge variant="success" className="bg-emerald-500 hover:bg-emerald-600">Ready</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>Latest service requests and ongoing repairs</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Calendar className="w-3 h-3" />
                Today
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Job ID</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Vehicle</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">{job.id}</td>
                      <td className="px-4 py-3">{job.customer}</td>
                      <td className="px-4 py-3">{job.vehicle}</td>
                      <td className="px-4 py-3 text-right">
                        {getStatusBadge(job.status)}
                      </td>
                    </tr>
                  ))}
                  {recentJobs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No recent jobs found
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
            <CardDescription>Key alerts for your garage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <div className="text-sm font-medium">3 Jobs Delayed</div>
                <div className="text-xs text-muted-foreground">Require attention to meet delivery dates</div>
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <div className="text-sm font-medium">Target Achieved</div>
                <div className="text-xs text-muted-foreground">Monthly revenue target reached 85%</div>
              </div>
            </div>
            <div className="pt-4">
              <div className="text-sm font-medium mb-3">Service Distribution</div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>General Service</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[65%]" />
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span>Body Work</span>
                  <span className="font-medium">20%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[20%]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
