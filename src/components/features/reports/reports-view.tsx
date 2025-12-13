"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, DollarSign, Car, Wrench, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { mockJobs } from "@/lib/mock-data"
// Note: mechanics import removed - mechanic performance section disabled

// Generate report data
const generateReportData = () => {
  const totalJobs = mockJobs.length
  const completedJobs = mockJobs.filter((j) => j.status === "completed").length
  const totalRevenue = mockJobs.reduce((sum, j) => sum + j.partsTotal + j.laborTotal + j.tax, 0)
  const avgJobValue = Math.round(totalRevenue / totalJobs)

  const monthlyRevenue = [
    { month: "Sep", revenue: 245000, jobs: 42 },
    { month: "Oct", revenue: 312000, jobs: 55 },
    { month: "Nov", revenue: 289000, jobs: 48 },
    { month: "Dec", revenue: 356000, jobs: 62 },
    { month: "Jan", revenue: 398000, jobs: 71 },
  ]

  const serviceTypes = [
    { name: "Oil Change", value: 35, color: "#3b82f6" },
    { name: "Brake Service", value: 25, color: "#10b981" },
    { name: "Engine Repair", value: 15, color: "#f59e0b" },
    { name: "AC Service", value: 12, color: "#8b5cf6" },
    { name: "Others", value: 13, color: "#6b7280" },
  ]

  /* MECHANIC PERFORMANCE DATA DISABLED
  const mechanicPerformance = mechanics.map((m) => {
    const jobs = mockJobs.filter((j) => j.mechanic?.id === m.id)
    const revenue = jobs.reduce((sum, j) => sum + j.partsTotal + j.laborTotal, 0)
    return {
      name: m.name.split(" ")[0],
      jobs: jobs.length + Math.floor(Math.random() * 10) + 5,
      revenue: revenue + Math.floor(Math.random() * 50000) + 20000,
    }
  })
  */
  const mechanicPerformance: any[] = [] // Placeholder - mechanic features disabled

  const weeklyJobs = [
    { day: "Mon", jobs: 12 },
    { day: "Tue", jobs: 15 },
    { day: "Wed", jobs: 18 },
    { day: "Thu", jobs: 14 },
    { day: "Fri", jobs: 20 },
    { day: "Sat", jobs: 22 },
    { day: "Sun", jobs: 5 },
  ]

  return {
    totalJobs,
    completedJobs,
    totalRevenue,
    avgJobValue,
    monthlyRevenue,
    serviceTypes,
    mechanicPerformance,
    weeklyJobs,
  }
}

export function ReportsView() {
  const data = useMemo(() => generateReportData(), [])

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${data.totalRevenue.toLocaleString("en-IN")}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Total Jobs",
      value: data.totalJobs.toString(),
      change: "+8.2%",
      trend: "up",
      icon: Wrench,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Avg Job Value",
      value: `₹${data.avgJobValue.toLocaleString("en-IN")}`,
      change: "+4.1%",
      trend: "up",
      icon: TrendingUp,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Completion Rate",
      value: `${Math.round((data.completedJobs / data.totalJobs) * 100)}%`,
      change: "-2.3%",
      trend: "down",
      icon: Car,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ]

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="month">
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {stat.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.title}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 5 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "hsl(var(--primary))" },
              }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">₹{payload[0].value?.toLocaleString("en-IN")}</p>
                            <p className="text-sm text-muted-foreground">{payload[0].payload.jobs} jobs</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Service Types Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Distribution</CardTitle>
            <CardDescription>Jobs by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.serviceTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {data.serviceTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {data.serviceTypes.map((type) => (
                <div key={type.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                    <span className="text-muted-foreground">{type.name}</span>
                  </div>
                  <span className="font-medium">{type.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* MECHANIC PERFORMANCE SECTION DISABLED */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mechanic Performance</CardTitle>
            <CardDescription>Feature temporarily disabled</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Mechanic features are currently disabled</p>
          </CardContent>
        </Card>

        {/* Weekly Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Job Distribution</CardTitle>
            <CardDescription>Jobs received per day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                jobs: { label: "Jobs", color: "hsl(var(--primary))" },
              }}
              className="h-[220px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.weeklyJobs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{payload[0].payload.jobs} jobs</p>
                            <p className="text-sm text-muted-foreground">{payload[0].payload.day}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="jobs"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
