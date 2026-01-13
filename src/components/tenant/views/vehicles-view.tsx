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
  Trash2,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { VehicleViewModel, VehicleFormData } from "@/lib/transformers";
import { VehicleDetailDialog } from "@/components/tenant/vehicles/vehicle-detail-dialog";
import { VehicleEditDialog } from "@/components/tenant/vehicles/vehicle-edit-dialog";
import { VehicleDeleteDialog } from "@/components/tenant/vehicles/vehicle-delete-dialog";

interface VehicleEditFormData {
  make: string;
  model: string;
  regNo: string;
  year: string;
  color: string;
  odometer: string;
}

interface VehiclesViewProps {
  vehicles: VehicleViewModel[];
  loading: boolean;
  error: string | null;
  makes?: { id: string; name: string }[];
  models?: { id: string; name: string }[];
  onMakeChange?: (makeId: string) => void;
  onAddVehicle: (data: VehicleFormData) => Promise<void>;
  onEditVehicle?: (id: string, data: VehicleEditFormData) => Promise<void>;
  onDeleteVehicle?: (id: string) => Promise<void>;
  onRetry: () => void;
  onCreateJob?: (vehicle: VehicleViewModel) => void;
}

export function VehiclesView({
  vehicles = [],
  loading = false,
  error = null,
  makes = [],
  models = [],
  onMakeChange,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onRetry,
  onCreateJob,
}: VehiclesViewProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<VehicleFormData>({
    makeId: "",
    modelId: "",
    regNo: "",
    year: "",
    color: "",
    odometer: "",
    ownerPhone: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Dialog states
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleViewModel | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const stats = useMemo(() => {
    return {
      total: vehicles.length,
      servicedThisMonth: Math.min(vehicles.length, 5),
    };
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return vehicles.filter(
      (v) =>
        (v.makeName || "").toLowerCase().includes(q) ||
        (v.modelName || "").toLowerCase().includes(q) ||
        (v.regNo || "").toLowerCase().includes(q) ||
        (v.ownerName || "").toLowerCase().includes(q)
    );
  }, [vehicles, searchQuery]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.regNo.trim()) {
      setAddError("Registration number is required");
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);
      await onAddVehicle(formData);
      setShowAddDialog(false);
      setFormData({
        makeId: "",
        modelId: "",
        regNo: "",
        year: "",
        color: "",
        odometer: "",
        ownerPhone: "",
      });
    } catch (err) {
      console.error("Error adding vehicle:", err);
      setAddError(err instanceof Error ? err.message : "Failed to add vehicle");
    } finally {
      setAddLoading(false);
    }
  };

  const handleViewDetails = (vehicle: VehicleViewModel) => {
    setSelectedVehicle(vehicle);
    setShowDetailDialog(true);
  };

  const handleEdit = (vehicle: VehicleViewModel) => {
    setSelectedVehicle(vehicle);
    setShowEditDialog(true);
    setShowDetailDialog(false);
  };

  const handleDelete = (vehicle: VehicleViewModel) => {
    setSelectedVehicle(vehicle);
    setShowDeleteDialog(true);
    setShowDetailDialog(false);
  };

  const handleSaveEdit = async (id: string, data: VehicleEditFormData) => {
    if (onEditVehicle) {
      await onEditVehicle(id, data);
      onRetry();
    }
  };

  const handleConfirmDelete = async (id: string) => {
    if (onDeleteVehicle) {
      await onDeleteVehicle(id);
      onRetry();
    }
  };

  const handleCreateJob = (vehicle: VehicleViewModel) => {
    setShowDetailDialog(false);
    onCreateJob?.(vehicle);
  };

  return (
    <div className="h-full flex flex-col p-3 md:p-6 space-y-4 md:space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-foreground">Vehicles</h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Vehicle registry and service history
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 w-fit">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span> Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>
                Enter vehicle details to create a new record.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit}>
              <div className="space-y-4 py-4">
                {addError && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                    {addError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Make</Label>
                    <Select
                      value={formData.makeId}
                      onValueChange={(val) => {
                        setFormData({ ...formData, makeId: val, modelId: "" });
                        onMakeChange?.(val);
                      }}
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
                    <Select
                      value={formData.modelId}
                      onValueChange={(val) =>
                        setFormData({ ...formData, modelId: val })
                      }
                      disabled={!formData.makeId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.makeId ? "Select model" : "Select make first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Registration No. <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="KA 01 AB 1234"
                      value={formData.regNo}
                      onChange={(e) =>
                        setFormData({ ...formData, regNo: e.target.value })
                      }
                      required
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
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={addLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addLoading}>
                  {addLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Vehicle
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card px-3 md:px-4 py-4 md:py-8 rounded-xl border border-border"
        >
          <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg md:text-2xl font-bold">{stats.total}</div>
              <div className="text-[10px] md:text-sm text-muted-foreground">
                Total Vehicles
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card px-3 md:px-4 py-4 md:py-8 rounded-xl border border-border"
        >
          <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wrench className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg md:text-2xl font-bold">
                {stats.servicedThisMonth}
              </div>
              <div className="text-[10px] md:text-sm text-muted-foreground">
                Serviced This Month
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by make, model, reg no..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-9 md:h-10 bg-background"
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
              <Card 
                className="hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => handleViewDetails(vehicle)}
              >
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
                          {vehicle.regNo}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(vehicle); }}>
                          View History
                        </DropdownMenuItem>
                        {onEditVehicle && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(vehicle); }}>
                            Edit Vehicle
                          </DropdownMenuItem>
                        )}
                        {onCreateJob && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCreateJob(vehicle); }}>
                            Create Job
                          </DropdownMenuItem>
                        )}
                        {onDeleteVehicle && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDelete(vehicle); }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
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

      {/* Detail Dialog */}
      <VehicleDetailDialog
        vehicle={selectedVehicle}
        isOpen={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateJob={onCreateJob ? handleCreateJob : undefined}
      />

      {/* Edit Dialog */}
      {onEditVehicle && (
        <VehicleEditDialog
          vehicle={selectedVehicle}
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSave={handleSaveEdit}
          makes={makes}
        />
      )}

      {/* Delete Dialog */}
      {onDeleteVehicle && (
        <VehicleDeleteDialog
          vehicle={selectedVehicle}
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
