"use client"

import { useState, useMemo, useEffect } from "react"
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
  RefreshCw,
  Plus,
  Eye,
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
import { useAuth } from "@/providers"
import { getAllTenants, type TenantWithStats } from "@/lib/supabase/services"
import { Spinner } from "@/components/ui/spinner"
import { TenantDetailsDialog } from "./tenant-details-dialog"
import { CreateTenantDialog } from "./create-tenant-dialog"

interface MechanicStats {
  id: string
  name: string
  garage: string
  jobsCompleted: number
  avgJobTime: number
  utilization: number
  rating: number
}

const adminNavItems = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "tenants", label: "Tenants", icon: Building2 },
  { id: "mechanics", label: "Mechanics", icon: HardHat },
  { id: "settings", label: "Settings", icon: Settings },
]

export function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeView, setActiveView] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [tenants, setTenants] = useState<TenantWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [showTenantDetails, setShowTenantDetails] = useState(false)
  const [showCreateTenant, setShowCreateTenant] = useState(false)

  // Fetch tenants from Supabase
  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllTenants()
      setTenants(data)
    } catch (err) {
      console.error('Failed to load tenants:', err)
      setError('Failed to load tenants. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (tenantId: string) => {
    setSelectedTenantId(tenantId)
    setShowTenantDetails(true)
  }

  const handleCreateTenantSuccess = () => {
    loadTenants()
  }

  const globalStats = useMemo(() => {
    const activeTenants = tenants.filter((t) => t.status === "active").length
    const totalRevenue = tenants.reduce((sum, t) => sum + (t.total_revenue || 0), 0)
    const totalJobs = tenants.reduce((sum, t) => sum + (t.completed_jobs || 0) + (t.active_jobs || 0), 0)
    const totalMechanics = tenants.reduce((sum, t) => sum + (t.mechanic_count || 0), 0)
    return { activeTenants, totalRevenue, totalJobs, totalMechanics }
  }, [tenants])

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery, tenants])

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
                    <AvatarImage src={(user as any)?.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{(user as any)?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{(user as any)?.name || 'Admin'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={signOut}>
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={loadTenants}
                        disabled={loading}
                      >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                      </Button>
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
                      <Button onClick={loadTenants} variant="outline">
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
                                      {new Date(tenant.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusColors[tenant.status || 'active']}>
                                  {(tenant.status || 'active').charAt(0).toUpperCase() + (tenant.status || 'active').slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={subscriptionColors[tenant.subscription || 'pro']}>
                                  {(tenant.subscription || 'pro').charAt(0).toUpperCase() + (tenant.subscription || 'pro').slice(1)}
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
                                    <DropdownMenuItem onClick={() => handleViewDetails(tenant.id)}>
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
            </>
          )}

          {activeView === "tenants" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tenant Management</CardTitle>
                    <CardDescription>Detailed tenant administration and management</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowCreateTenant(true)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Tenant
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={loadTenants}
                      disabled={loading}
                    >
                      <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
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
                    <Button onClick={loadTenants} variant="outline">
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
                                    {new Date(tenant.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColors[tenant.status || 'active']}>
                                {(tenant.status || 'active').charAt(0).toUpperCase() + (tenant.status || 'active').slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={subscriptionColors[tenant.subscription || 'pro']}>
                                {(tenant.subscription || 'pro').charAt(0).toUpperCase() + (tenant.subscription || 'pro').slice(1)}
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
                                  <DropdownMenuItem onClick={() => handleViewDetails(tenant.id)}>
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
                        <div className="text-2xl font-bold">-</div>
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
                        <div className="text-2xl font-bold">-</div>
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
                  <CardDescription>Performance metrics across all garages (Coming Soon)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <HardHat className="w-12 h-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      Mechanic activity tracking will be implemented with real-time data
                    </p>
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

      {/* Dialogs */}
      <TenantDetailsDialog
        tenantId={selectedTenantId}
        open={showTenantDetails}
        onOpenChange={setShowTenantDetails}
      />
      <CreateTenantDialog
        open={showCreateTenant}
        onOpenChange={setShowCreateTenant}
        onSuccess={handleCreateTenantSuccess}
      />
    </div>
  )
}
