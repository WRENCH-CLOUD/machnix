"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Car,
  Calendar,
  Gauge,
  MoreHorizontal,
  User,
  Wrench,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// TODO: scptical about this needed revision
// TODO: somehow need to import this to where lol???!!! @sagun25
export interface Vehicle {
  id: string;
  makeName: string;
  modelName: string;
  reg_no: string;
  year?: number;
  color?: string;
  odometer?: number;
  ownerName?: string;
  totalJobs?: number;
  lastService?: Date;
}

interface VehiclesViewProps {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  makes?: { id: string; name: string }[];
  onAddVehicle: (data: any) => Promise<void>;
  onRetry: () => void;
}

export function VehiclesView({
  vehicles = [],
  loading = false,
  error = null,
  makes = [],
  onAddVehicle,
  onRetry,
}: VehiclesViewProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState<any>({
    makeId: "",
    model: "",
    regNo: "",
    year: "",
    color: "",
    odometer: "",
    ownerPhone: "",
  })

  const stats = useMemo(() => {
    return {
      total: vehicles.length,
      servicedThisMonth: Math.min(vehicles.length, 5),
    }
  }, [vehicles])

  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return vehicles.filter(v =>
      (v.makeName || "").toLowerCase().includes(q) ||
      (v.modelName || "").toLowerCase().includes(q) ||
      (v.reg_no || "").toLowerCase().includes(q) ||
      (v.ownerName || "").toLowerCase().includes(q)
    )
  }, [vehicles, searchQuery])

  const handleAddSubmit = async () => {
    if (!onAddVehicle) {
      setShowAddDialog(false)
      return
    }
    await onAddVehicle(formData)
    setShowAddDialog(false)
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
          <p className="text-muted-foreground">
            Vehicle registry and service history
          </p>
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
              <DialogDescription>
                Enter vehicle details to create a new record.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Select
                    value={formData.makeId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, makeId: val })
                    }
                  >
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
                  <Input
                    placeholder="Enter model"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Registration No.</Label>
                  <Input
                    placeholder="KA 01 AB 1234"
                    value={formData.regNo}
                    onChange={(e) =>
                      setFormData({ ...formData, regNo: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    placeholder="2024"
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    placeholder="Enter color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Odometer (km)</Label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={formData.odometer}
                    onChange={(e) =>
                      setFormData({ ...formData, odometer: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Owner Phone (for linking)</Label>
                <Input
                  placeholder="+91 99999 99999"
                  value={formData.ownerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerPhone: e.target.value })
                  }
                />
              </div>
              <Button className="w-full" onClick={handleAddSubmit}>
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
          className="bg-card px-4 py-8 rounded-xl border border-border" // Updated to match card style (or maintain legacy style if preferred) - checking legacy
        >
          {/* Using legacy structure for card content to match exact look */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">
                Total Vehicles
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card px-4 py-8 rounded-xl border border-border"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stats.servicedThisMonth}
              </div>
              <div className="text-sm text-muted-foreground">
                Serviced This Month
              </div>
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
          className="pl-10 h-10 bg-background"
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
          <Button onClick={onRetry} className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery
              ? "No vehicles found matching your search"
              : "No vehicles yet. Add your first vehicle to get started."}
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
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Car className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {vehicle.makeName || "Unknown"}{" "}
                          {vehicle.modelName || "Unknown"}
                        </CardTitle>
                        <CardDescription className="font-mono">
                          {vehicle.reg_no}
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
                      <div className="text-lg font-semibold">
                        {vehicle.totalJobs || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Jobs
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {vehicle.lastService
                          ? new Date(vehicle.lastService).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last Service
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
