"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Phone, Mail, MapPin, Car, MoreHorizontal, User, Briefcase, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { CustomerService } from "@/lib/supabase/services/customer.service"
import { VehicleService } from "@/lib/supabase/services/vehicle.service"
import { JobService } from "@/lib/supabase/services/job.service"
import { useAuth } from "@/providers/auth-provider"
import type { Database } from "@/lib/supabase/database.types"

type Customer = Database['tenant']['Tables']['customers']['Row']
type Vehicle = Database['tenant']['Tables']['vehicles']['Row']
type Jobcard = Database['tenant']['Tables']['jobcards']['Row']

interface CustomerWithStats extends Customer {
  totalJobs: number
  lastVisit: Date | null
  vehicleCount: number
  vehicles: Array<{ make: string | null; model: string | null }>
}

export function CustomersView() {
  const { tenantId } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tenantId) {
      loadCustomers()
    }
  }, [tenantId])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch customers with vehicles
      const customersData = await CustomerService.getCustomers()
      
      // Fetch all jobs to calculate stats
      const jobsData = await JobService.getJobs()
      
      // Build customer stats
      const customersWithStats: CustomerWithStats[] = await Promise.all(
        customersData.map(async (customer) => {
          const customerJobs = jobsData.filter(job => job.customer_id === customer.id)
          const lastJob = customerJobs.length > 0 
            ? new Date(Math.max(...customerJobs.map(j => new Date(j.created_at).getTime())))
            : null
          
          // Get vehicle makes and models
          const vehicleDetails = await Promise.all(
            (customer.vehicles || []).map(async (vehicle) => {
              let makeName = null
              let modelName = null
              
              if (vehicle.make_id) {
                const make = await VehicleService.getMakeById(vehicle.make_id)
                makeName = make?.name || null
              }
              
              if (vehicle.model_id) {
                const model = await VehicleService.getModelById(vehicle.model_id)
                modelName = model?.name || null
              }
              
              return { make: makeName, model: modelName }
            })
          )

          return {
            ...customer,
            totalJobs: customerJobs.length,
            lastVisit: lastJob,
            vehicleCount: customer.vehicles?.length || 0,
            vehicles: vehicleDetails,
          }
        })
      )

      setCustomers(customersWithStats)
    } catch (err) {
      console.error('Error loading customers:', err)
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [customers, searchQuery])

  const stats = useMemo(
    () => ({
      total: customers.length,
      totalJobs: customers.reduce((sum, c) => sum + c.totalJobs, 0),
      avgJobs: customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.totalJobs, 0) / customers.length) : 0,
    }),
    [customers],
  )

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Enter customer details to create a new record.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Enter customer name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+91 99999 99999" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input placeholder="customer@email.com" type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="Enter full address" />
              </div>
              <Button className="w-full" onClick={() => setShowAddDialog(false)}>
                Create Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.avgJobs}</div>
              <div className="text-sm text-muted-foreground">Avg. Jobs/Customer</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button onClick={loadCustomers} className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No customers found matching your search' : 'No customers yet. Add your first customer to get started.'}
          </p>
        </div>
      )}

      {/* Customer Grid */}
      {!loading && !error && filteredCustomers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, index) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {customer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{customer.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Customer</DropdownMenuItem>
                      <DropdownMenuItem>Create Job</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {customer.vehicles.length > 0 ? (
                    customer.vehicles.map((vehicle, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No vehicles registered</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{customer.totalJobs}</div>
                    <div className="text-xs text-muted-foreground">Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{customer.vehicleCount}</div>
                    <div className="text-xs text-muted-foreground">Vehicles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {customer.lastVisit
                        ? customer.lastVisit.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Last Visit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        </div>
      )}
    </div>
  )
}
