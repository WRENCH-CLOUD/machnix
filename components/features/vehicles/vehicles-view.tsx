"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Car, Calendar, Gauge, MoreHorizontal, User, Wrench, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleService } from "@/lib/supabase/services/vehicle.service"
import { CustomerService } from "@/lib/supabase/services/customer.service"
import { JobService } from "@/lib/supabase/services/job.service"
import { useAuth } from "@/providers/auth-provider"
import type { Database } from "@/lib/supabase/database.types"

type Vehicle = Database['tenant']['Tables']['vehicles']['Row']
type Customer = Database['tenant']['Tables']['customers']['Row']
type VehicleMake = Database['public']['Tables']['vehicle_make']['Row']

interface VehicleWithStats extends Vehicle {
  makeName: string | null
  modelName: string | null
  ownerName: string | null
  ownerPhone: string | null
  totalJobs: number
  lastService: Date | null
}

export function VehiclesView() {
  const { tenantId } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [vehicles, setVehicles] = useState<VehicleWithStats[]>([])
  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tenantId) {
      loadVehicles()
      loadMakes()
    }
  }, [tenantId])

  const loadMakes = async () => {
    try {
      const makesData = await VehicleService.getMakes()
      setMakes(makesData)
    } catch (err) {
      console.error('Error loading makes:', err)
    }
  }

  const loadVehicles = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch vehicles with customer data
      const vehiclesData = await VehicleService.getVehiclesWithRelations()
      
      // Fetch all jobs to calculate stats
      const jobsData = await JobService.getJobs()
      
      // Build vehicle stats
      const vehiclesWithStats: VehicleWithStats[] = await Promise.all(
        vehiclesData.map(async (vehicle) => {
          let makeName = null
          let modelName = null
          
          // Look up make and model names
          if (vehicle.make_id) {
            const make = await VehicleService.getMakeById(vehicle.make_id)
            makeName = make?.name || null
          }
          
          if (vehicle.model_id) {
            const model = await VehicleService.getModelById(vehicle.model_id)
            modelName = model?.name || null
          }
          
          const vehicleJobs = jobsData.filter(job => job.vehicle_id === vehicle.id)
          const lastJob = vehicleJobs.length > 0 
            ? new Date(Math.max(...vehicleJobs.map(j => new Date(j.created_at).getTime())))
            : null

          return {
            ...vehicle,
            makeName,
            modelName,
            ownerName: vehicle.customer?.name || null,
            ownerPhone: vehicle.customer?.phone || null,
            totalJobs: vehicleJobs.length,
            lastService: lastJob,
          }
        })
      )

      setVehicles(vehiclesWithStats)
    } catch (err) {
      console.error('Error loading vehicles:', err)
      setError('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(
      (vehicle) =>
        (vehicle.makeName && vehicle.makeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vehicle.modelName && vehicle.modelName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        vehicle.reg_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicle.ownerName && vehicle.ownerName.toLowerCase().includes(searchQuery.toLowerCase())),
    )
  }, [vehicles, searchQuery])

  const stats = useMemo(
    () => ({
      total: vehicles.length,
      servicedThisMonth: vehicles.filter((v) => {
        if (!v.lastService) return false
        const now = new Date()
        return v.lastService.getMonth() === now.getMonth() && v.lastService.getFullYear() === now.getFullYear()
      }).length,
    }),
    [vehicles],
  )

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
          <p className="text-muted-foreground">Vehicle registry and service history</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>Enter vehicle details to create a new record.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      {makes.map((make) => (
                        <SelectItem key={make.id} value={make.id}>
                          {make.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input placeholder="Enter model" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Registration No.</Label>
                  <Input placeholder="KA 01 AB 1234" />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input placeholder="2024" type="number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input placeholder="Enter color" />
                </div>
                <div className="space-y-2">
                  <Label>Odometer (km)</Label>
                  <Input placeholder="0" type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Owner Phone (for linking)</Label>
                <Input placeholder="+91 99999 99999" />
              </div>
              <Button className="w-full" onClick={() => setShowAddDialog(false)}>
                Add Vehicle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Vehicles</div>
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
              <Wrench className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.servicedThisMonth}</div>
              <div className="text-sm text-muted-foreground">Serviced This Month</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by make, model, reg no, or owner..."
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
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button onClick={loadVehicles} className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No vehicles found matching your search' : 'No vehicles yet. Add your first vehicle to get started.'}
          </p>
        </div>
      )}

      {/* Vehicle Grid */}
      {!loading && !error && filteredVehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {vehicle.makeName || 'Unknown'} {vehicle.modelName || 'Unknown'}
                      </CardTitle>
                      <CardDescription className="font-mono">{vehicle.reg_no}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View History</DropdownMenuItem>
                      <DropdownMenuItem>Edit Vehicle</DropdownMenuItem>
                      <DropdownMenuItem>Create Job</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  {vehicle.year && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {vehicle.year}
                    </span>
                  )}
                </div>
                {vehicle.odometer && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>{vehicle.odometer.toLocaleString("en-IN")} km</span>
                  </div>
                )}
                {vehicle.ownerName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{vehicle.ownerName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{vehicle.totalJobs}</div>
                    <div className="text-xs text-muted-foreground">Total Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {vehicle.lastService
                        ? vehicle.lastService.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Last Service</div>
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
