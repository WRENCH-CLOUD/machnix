"use client";

import {
  Car,
  Calendar,
  Gauge,
  User,
  X,
  Briefcase,
  Wrench,
  Palette,
  FileText,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { VehicleViewModel } from "@/lib/transformers";

interface VehicleDetailDialogProps {
  vehicle: VehicleViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (vehicle: VehicleViewModel) => void;
  onDelete: (vehicle: VehicleViewModel) => void;
  onCreateJob?: (vehicle: VehicleViewModel) => void;
}

function padNumber(n: number): string {
  return n.toString().padStart(2, "0");
}

export function VehicleDetailDialog({
  vehicle,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCreateJob,
}: VehicleDetailDialogProps) {
  if (!vehicle || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-full sm:max-w-[540px] p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh] rounded-2xl bg-card"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Vehicle Details</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="relative flex flex-col items-center pt-8 pb-2 px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="w-20 h-20 rounded-full border-2 border-border mb-4 bg-muted flex items-center justify-center">
            <Car className="w-8 h-8 text-foreground" />
          </div>

          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-foreground">
              {vehicle.makeName || "Unknown"} {vehicle.modelName || "Unknown"}
            </h2>
            {vehicle.year && (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
              >
                {vehicle.year}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            {vehicle.ownerName && (
              <>
                <User className="w-3.5 h-3.5" />
                <span>{vehicle.ownerName}</span>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 flex-none">
            <TabsList className="h-10 bg-transparent border-0 p-0 gap-6">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground rounded-none p-2 h-10 text-sm font-semibold"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground rounded-none p-2 h-10 text-sm text-muted-foreground data-[state=active]:text-foreground"
              >
                Service History
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="details" className="m-0 px-6 pt-6 pb-4 space-y-6">
              {/* Vehicle Information */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                  Vehicle Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicle.year && (
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-xl border border-border/50">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mb-0.5">
                          Year
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {vehicle.year}
                        </p>
                      </div>
                    </div>
                  )}
                  {vehicle.color && (
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-xl border border-border/50">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mb-0.5">
                          Color
                        </p>
                        <p className="text-sm font-medium text-foreground capitalize">
                          {vehicle.color}
                        </p>
                      </div>
                    </div>
                  )}
                  {vehicle.odometer && (
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-xl border border-border/50">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mb-0.5">
                          Odometer
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {vehicle.odometer.toLocaleString("en-IN")} km
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-xl border border-border/50">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mb-0.5">
                        License
                      </p>
                      <p className="text-sm font-medium text-foreground font-mono">
                        {vehicle.regNo}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                  Owner
                </h3>
                <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-xl border border-border/50">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mb-0.5">
                      Vehicle Owner
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {vehicle.ownerName || "Unknown Owner"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Metrics */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                  Service Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 border border-border/50 rounded-xl p-4 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-foreground tracking-tight">
                      {padNumber(vehicle.totalJobs || 0)}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mt-1">
                      Total Services
                    </div>
                  </div>
                  <div className="bg-muted/40 border border-border/50 rounded-xl p-4 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-lg font-bold text-foreground tracking-tight">
                      {vehicle.lastService
                        ? new Date(vehicle.lastService).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                            }
                          )
                        : "N/A"}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mt-1">
                      Last Service
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="m-0 px-6 pt-6 pb-4 space-y-3">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                Service History
              </h3>
              {vehicle.totalJobs && vehicle.totalJobs > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-xl border border-border/50">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {vehicle.totalJobs} service{vehicle.totalJobs > 1 ? "s" : ""} completed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last service on{" "}
                        {vehicle.lastService
                          ? new Date(vehicle.lastService).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No service history available
                  </p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="border-t border-border/50 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            {onCreateJob && (
              <Button
                size="sm"
                className="rounded-full px-5 text-xs font-semibold uppercase tracking-wider h-9"
                onClick={() => onCreateJob(vehicle)}
              >
                Create Job
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-5 text-xs font-semibold uppercase tracking-wider h-9"
              onClick={() => onEdit(vehicle)}
            >
              Modify Details
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-full px-5 text-xs font-semibold uppercase tracking-wider h-9 ml-auto"
              onClick={() => onDelete(vehicle)}
            >
              Delete Vehicle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
