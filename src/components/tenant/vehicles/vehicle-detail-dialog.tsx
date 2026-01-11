"use client";

import {
  Car,
  Calendar,
  Gauge,
  User,
  Edit,
  Trash2,
  Briefcase,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { VehicleViewModel } from "@/lib/transformers";

interface VehicleDetailDialogProps {
  vehicle: VehicleViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (vehicle: VehicleViewModel) => void;
  onDelete: (vehicle: VehicleViewModel) => void;
  onCreateJob?: (vehicle: VehicleViewModel) => void;
}

export function VehicleDetailDialog({
  vehicle,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCreateJob,
}: VehicleDetailDialogProps) {
  if (!vehicle) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Car className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl">
                {vehicle.makeName} {vehicle.modelName}
              </SheetTitle>
              <SheetDescription className="font-mono">
                {vehicle.regNo}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        {/* Vehicle Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Vehicle Information
          </h3>
          <div className="space-y-3">
            {vehicle.year && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
              </div>
            )}
            {vehicle.color && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-border"
                    style={{ backgroundColor: vehicle.color.toLowerCase() }}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Color</p>
                  <p className="font-medium capitalize">{vehicle.color}</p>
                </div>
              </div>
            )}
            {vehicle.odometer && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Gauge className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Odometer</p>
                  <p className="font-medium">
                    {vehicle.odometer.toLocaleString("en-IN")} km
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Owner Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Owner
          </h3>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">
              {vehicle.ownerName || "Unknown Owner"}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Service History Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Service History
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold">{vehicle.totalJobs || 0}</div>
              <div className="text-xs text-muted-foreground">Total Services</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-sm font-medium">
                {vehicle.lastService
                  ? new Date(vehicle.lastService).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </div>
              <div className="text-xs text-muted-foreground">Last Service</div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Actions */}
        <div className="space-y-3">
          {onCreateJob && (
            <Button className="w-full" onClick={() => onCreateJob(vehicle)}>
              <Briefcase className="w-4 h-4 mr-2" />
              Create New Job
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(vehicle)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => onDelete(vehicle)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
