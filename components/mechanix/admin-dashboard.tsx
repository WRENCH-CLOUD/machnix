"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Building2,
  DollarSign,
  Wrench,
  Users,
  TrendingUp,
  MoreHorizontal,
  ChevronRight,
  Search,
  LogIn,
  Bell,
  LogOut,
  Settings,
  HardHat,
  Activity,
  BarChart3,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

// Mock tenant data
interface Tenant {
  id: string
  name: string
  status: "active" | "suspended" | "trial"
  subscription: "starter" | "pro" | "enterprise"
  customerCount: number
  activeJobs: number
  completedJobs: number
  revenue: number
  mechanicCount: number
  createdAt: Date
}

interface MechanicStats {
  id: string
  name: string
  garage: string
  jobsCompleted: number
  avgJobTime: number
  utilization: number
  rating: number
}

const tenants: Tenant[] = [
  {
    id: "t1",
    name: "Speedy Fix Garage",
    status: "active",
    subscription: "pro",
    customerCount: 342,
    activeJobs: 12,
    completedJobs: 1856,
    revenue: 2845000,
    mechanicCount: 8,
    createdAt: new Date("2023-03-15"),
  },
  {
    id: "t2",
    name: "Downtown Auto",
    status: "active",
    subscription: "enterprise",
    customerCount: 567,
    activeJobs: 24,
    completedJobs: 3421,
    revenue: 5678000,
    mechanicCount: 15,
    createdAt: new Date("2022-11-20"),
  },
  {
    id: "t3",
    name: "Quick Service Center",
    status: "active",
    subscription: "pro",
    customerCount: 234,
    activeJobs: 8,
    completedJobs: 1234,
    revenue: 1890000,
    mechanicCount: 6,
    createdAt: new Date("2023-06-10"),
  },
  {
    id: "t4",
    name: "Metro Mechanics",
    status: "trial",
    subscription: "starter",
    customerCount: 45,
    activeJobs: 3,
    completedJobs: 67,
    revenue: 125000,
    mechanicCount: 2,
    createdAt: new Date("2024-01-05"),
  },
  {
    id: "t5",
    name: "AutoCare Plus",
    status: "suspended",
    subscription: "pro",
    customerCount: 189,
    activeJobs: 0,
    completedJobs: 892,
    revenue: 1456000,
    mechanicCount: 5,
    createdAt: new Date("2023-08-22"),
  },
  {
    id: "t6",
    name: "Premium Auto Works",
    status: "active",
    subscription: "enterprise",
    customerCount: 423,
    activeJobs: 18,
    completedJobs: 2567,
    revenue: 4234000,
    mechanicCount: 12,
    createdAt: new Date("2023-01-08"),
  },
]

const mechanicStats: MechanicStats[] = [
  {
    id: "m1",
    name: "Ravi Kumar",
    garage: "Speedy Fix Garage",
    jobsCompleted: 156,
    avgJobTime: 2.4,
    utilization: 92,
    rating: 4.8,
  },
  {
    id: "m2",
    name: "Suresh Patel",
    garage: "Downtown Auto",
    jobsCompleted: 189,
    avgJobTime: 2.1,
    utilization: 95,
    rating: 4.9,
  },
  {
    id: "m3",
    name: "Amit Singh",
    garage: "Quick Service Center",
    jobsCompleted: 134,
    avgJobTime: 2.8,
    utilization: 88,
    rating: 4.7,
  },
  {
    id: "m4",
    name: "Deepak Sharma",
    garage: "Premium Auto Works",
    jobsCompleted: 178,
    avgJobTime: 2.2,
    utilization: 91,
    rating: 4.8,
  },
  {
    id: "m5",
    name: "Vijay Rao",
    garage: "Downtown Auto",
    jobsCompleted: 167,
    avgJobTime: 2.5,
    utilization: 89,
    rating: 4.6,
  },
  {
    id: "m6",
    name: "Kiran Das",
    garage: "Speedy Fix Garage",
    jobsCompleted: 145,
    avgJobTime: 2.6,
    utilization: 86,
    rating: 4.7,
  },
]

const adminNavItems = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "tenants", label: "Tenants", icon: Building2 },
  { id: "mechanics", label: "Mechanics", icon: HardHat },
  { id: "settings", label: "Settings", icon: Settings },
]

export function AdminDashboard() {
  const { user, logout } = useAuth()
  const [activeView, setActiveView] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const globalStats = useMemo(() => {
    const activeTenants = tenants.filter((t) => t.status === "active").length
    const totalRevenue = tenants.reduce((sum, t) => sum + t.revenue, 0)
    const totalJobs = tenants.reduce((sum, t) => sum + t.completedJobs + t.activeJobs, 0)
    const totalMechanics = tenants.reduce((sum, t) => sum + t.mechanicCount, 0)
    return { activeTenants, totalRevenue, totalJobs, totalMechanics }
  }, [])

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  const statusColors = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    suspended: "bg-red-500/10 text-red-500 border-red-500/20",
    trial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  }

  const subscriptionColors = {
    starter: "bg-slate-500/10 text-slate-400",
    pro: "bg-primary/10 text-primary",
    enterprise: "bg-purple-500/10 text-purple-500",
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Admin Sidebar - Darker theme */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">Mechanix</span>
                <span className="text-xs text-zinc-500 block">Central Admin</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive ? "bg-primary text-primary-foreground" : "text-zinc-400 hover:text-white hover:bg-zinc-800",
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-3 border-t border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full justify-center text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ChevronRight className={cn("w-4 h-4 transition-transform", sidebarCollapsed ? "" : "rotate-180")} />
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {adminNavItems.find((i) => i.id === activeView)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                5
              </span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {activeView === "overview" && (
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
                    change: "+3 this month",
                  },
                  {
                    title: "Total Revenue",
                    value: `₹${(globalStats.totalRevenue / 100000).toFixed(1)}L`,
                    icon: DollarSign,
                    color: "text-emerald-500",
                    bgColor: "bg-emerald-500/10",
                    change: "+12.5% vs last month",
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
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tenants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
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
                        const totalJobs = tenant.activeJobs + tenant.completedJobs
                        const completionRate = totalJobs > 0 ? (tenant.completedJobs / totalJobs) * 100 : 0

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
                                    {tenant.createdAt.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColors[tenant.status]}>
                                {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={subscriptionColors[tenant.subscription]}>
                                {tenant.subscription.charAt(0).toUpperCase() + tenant.subscription.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{tenant.customerCount}</div>
                            </TableCell>
                            <TableCell>
                              <div className="w-32">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">{tenant.activeJobs} active</span>
                                  <span className="text-muted-foreground">{tenant.completedJobs} done</span>
                                </div>
                                <Progress value={completionRate} className="h-2" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-emerald-500">
                                ₹{(tenant.revenue / 100000).toFixed(1)}L
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{tenant.mechanicCount}</span>
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
                                  <DropdownMenuItem>
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Login as Tenant
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Manage Subscription</DropdownMenuItem>
                                  <DropdownMenuItem>View Details</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {activeView === "tenants" && (
            <Card>
              <CardHeader>
                <CardTitle>Tenant Management</CardTitle>
                <CardDescription>Detailed tenant administration</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Full tenant management interface coming soon...</p>
              </CardContent>
            </Card>
          )}

          {activeView === "mechanics" && (
            <>
              {/* Mechanic Stats Header */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <HardHat className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{globalStats.totalMechanics}</div>
                        <div className="text-sm text-muted-foreground">Total Mechanics</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">89%</div>
                        <div className="text-sm text-muted-foreground">Avg. Utilization</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">2.4h</div>
                        <div className="text-sm text-muted-foreground">Avg. Job Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mechanic Activity Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Global Mechanic Activity</CardTitle>
                  <CardDescription>Performance metrics across all garages</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mechanic</TableHead>
                        <TableHead>Garage</TableHead>
                        <TableHead>Jobs Completed</TableHead>
                        <TableHead>Avg. Job Time</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead>Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mechanicStats
                        .sort((a, b) => b.utilization - a.utilization)
                        .map((mechanic, index) => (
                          <motion.tr
                            key={mechanic.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback>{mechanic.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{mechanic.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{mechanic.garage}</TableCell>
                            <TableCell>
                              <span className="font-medium">{mechanic.jobsCompleted}</span>
                            </TableCell>
                            <TableCell>{mechanic.avgJobTime}h</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={mechanic.utilization} className="w-20 h-2" />
                                <span className="text-sm">{mechanic.utilization}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="gap-1">
                                <span className="text-amber-500">★</span>
                                {mechanic.rating}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Utilization Heatmap */}
              <Card>
                <CardHeader>
                  <CardTitle>Garage Mechanic Utilization</CardTitle>
                  <CardDescription>Garages with highest mechanic utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenants
                      .filter((t) => t.status === "active")
                      .sort((a, b) => b.mechanicCount - a.mechanicCount)
                      .slice(0, 5)
                      .map((tenant, index) => {
                        const utilization = 75 + Math.random() * 20
                        return (
                          <div key={tenant.id} className="flex items-center gap-4">
                            <div className="w-40 truncate font-medium">{tenant.name}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={utilization}
                                  className={cn(
                                    "h-3",
                                    utilization > 90
                                      ? "[&>div]:bg-emerald-500"
                                      : utilization > 80
                                        ? "[&>div]:bg-amber-500"
                                        : "[&>div]:bg-primary",
                                  )}
                                />
                                <span className="text-sm font-medium w-12">{utilization.toFixed(0)}%</span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">{tenant.mechanicCount} mechanics</div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeView === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>Platform configuration and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Admin settings interface coming soon...</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
