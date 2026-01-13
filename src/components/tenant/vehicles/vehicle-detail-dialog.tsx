"use client";

import {
  Car,
  Calendar,
  Gauge,
  User,
  X,
  Edit,
  Trash2,
  Briefcase,
  Wrench,
  Palette,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  if (!vehicle || !isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center overflow-y-auto py-4 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-card rounded-xl border border-border shadow-2xl overflow-hidden my-4 relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                  <Car className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-foreground">
                      {vehicle.makeName || "Unknown"} {vehicle.modelName || "Unknown"}
                    </h2>
                    {vehicle.year && (
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-500 border-blue-500/30"
                      >
                        {vehicle.year}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground">
                      {vehicle.regNo}
                    </span>
                    {vehicle.ownerName && (
                      <>
                        <span>•</span>
                        <User className="w-4 h-4" />
                        <span>{vehicle.ownerName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
              <div className="border-b border-border px-6 flex-none">
                <TabsList className="h-12 bg-transparent border-0 p-0 gap-6">
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 h-12"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 h-12"
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    Service History
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="details" className="m-0 p-6 space-y-6">
                  {/* Vehicle Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Vehicle Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vehicle.year && (
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Year
                            </p>
                            <p className="font-medium text-foreground">
                              {vehicle.year}
                            </p>
                          </div>
                        </div>
                      )}
                      {vehicle.color && (
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Color
                            </p>
                            <p className="font-medium text-foreground capitalize">
                              {vehicle.color}
                            </p>
                          </div>
                        </div>
                      )}
                      {vehicle.odometer && (
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Gauge className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Odometer
                            </p>
                            <p className="font-medium text-foreground">
                              {vehicle.odometer.toLocaleString("en-IN")} km
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Owner Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Owner
                    </h3>
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {vehicle.ownerName || "Unknown Owner"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vehicle Owner
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Statistics */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Service Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          {vehicle.totalJobs || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Services
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="text-sm font-bold text-foreground">
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
                  </div>
                </TabsContent>

                <TabsContent value="history" className="m-0 p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Service History
                  </h3>
                  {vehicle.totalJobs && vehicle.totalJobs > 0 ? (
                    <div className="space-y-3">
                      {/* Placeholder for service history - you can expand this with actual job data */}
                      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {vehicle.totalJobs} service{vehicle.totalJobs > 1 ? "s" : ""} completed
                          </p>
                          <p className="text-sm text-muted-foreground">
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
                      <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No service history for this vehicle
                      </p>
                      {onCreateJob && (
                        <Button
                          className="mt-4"
                          onClick={() => onCreateJob(vehicle)}
                        >
                          <Briefcase className="w-4 h-4 mr-2" />
                          Create First Job
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer Actions */}
            <div className="border-t border-border p-4 bg-secondary/30">
              <div className="flex flex-col sm:flex-row gap-3">
                {onCreateJob && (
                  <Button
                    className="flex-1"
                    onClick={() => onCreateJob(vehicle)}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Create New Job
                  </Button>
                )}
                <div className="flex gap-2 flex-1">
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
