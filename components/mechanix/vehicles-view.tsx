"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Car, Calendar, Gauge, MoreHorizontal, User, Wrench, AlertTriangle } from "lucide-react"
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
import { mockJobs } from "@/lib/mock-data"

interface VehicleRecord {
  id: string
  make: string
  model: string
  year: number
  regNo: string
  color: string
  ownerName: string
  ownerPhone: string
  totalJobs: number
  lastService: Date
  odometer: number
  pendingIssues: number
}

// Generate vehicle data from jobs
const generateVehicles = (): VehicleRecord[] => {
  const vehicleMap = new Map<string, VehicleRecord>()

  mockJobs.forEach((job) => {
    const existing = vehicleMap.get(job.vehicle.id)
    const pendingDVI = job.dviItems.filter((item) => item.status === "urgent" || item.status === "attention").length

    if (existing) {
      existing.totalJobs += 1
      if (job.createdAt > existing.lastService) {
        existing.lastService = job.createdAt
      }
      existing.pendingIssues = Math.max(existing.pendingIssues, pendingDVI)
    } else {
      vehicleMap.set(job.vehicle.id, {
        ...job.vehicle,
        ownerName: job.customer.name,
        ownerPhone: job.customer.phone,
        totalJobs: 1,
        lastService: job.createdAt,
        odometer: Math.floor(Math.random() * 80000) + 15000,
        pendingIssues: pendingDVI,
      })
    }
  })

  // Add some additional mock vehicles
  const additionalVehicles: VehicleRecord[] = [
    {
      id: "v10",
      make: "BMW",
      model: "3 Series",
      year: 2022,
      regNo: "KA 01 XY 9999",
      color: "Black",
      ownerName: "Arun Mehta",
      ownerPhone: "+91 99001 12233",
      totalJobs: 4,
      lastService: new Date("2024-01-10"),
      odometer: 28500,
      pendingIssues: 0,
    },
    {
      id: "v11",
      make: "Mercedes",
      model: "C-Class",
      year: 2021,
      regNo: "KA 02 AB 1111",
      color: "White",
      ownerName: "Sneha Kapoor",
      ownerPhone: "+91 88776 55443",
      totalJobs: 3,
      lastService: new Date("2024-01-08"),
      odometer: 42000,
      pendingIssues: 2,
    },
    {
      id: "v12",
      make: "Audi",
      model: "Q5",
      year: 2023,
      regNo: "KA 03 CD 2222",
      color: "Gray",
      ownerName: "Rahul Joshi",
      ownerPhone: "+91 77665 44332",
      totalJobs: 1,
      lastService: new Date("2024-01-05"),
      odometer: 12000,
      pendingIssues: 0,
    },
  ]

  additionalVehicles.forEach((v) => vehicleMap.set(v.id, v))

  return Array.from(vehicleMap.values())
}

const carMakes = ["Toyota", "Honda", "Maruti", "Hyundai", "Tata", "Mahindra", "BMW", "Mercedes", "Audi", "Volkswagen"]

export function VehiclesView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const vehicles = useMemo(() => generateVehicles(), [])

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(
      (vehicle) =>
        vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.ownerName.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [vehicles, searchQuery])

  const stats = useMemo(
    () => ({
      total: vehicles.length,
      withIssues: vehicles.filter((v) => v.pendingIssues > 0).length,
      servicedThisMonth: vehicles.filter((v) => {
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
                      {carMakes.map((make) => (
                        <SelectItem key={make} value={make.toLowerCase()}>
                          {make}
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
      <div className="grid grid-cols-3 gap-4">
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
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.withIssues}</div>
              <div className="text-sm text-muted-foreground">With Pending Issues</div>
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

      {/* Vehicle Grid */}
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
                        {vehicle.make} {vehicle.model}
                      </CardTitle>
                      <CardDescription className="font-mono">{vehicle.regNo}</CardDescription>
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
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: vehicle.color.toLowerCase() === "white" ? "#f1f5f9" : undefined }}
                  >
                    {vehicle.color}
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {vehicle.year}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>{vehicle.odometer.toLocaleString("en-IN")} km</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{vehicle.ownerName}</span>
                </div>
                {vehicle.pendingIssues > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {vehicle.pendingIssues} Pending Issues
                  </Badge>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{vehicle.totalJobs}</div>
                    <div className="text-xs text-muted-foreground">Total Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {vehicle.lastService.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">Last Service</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
