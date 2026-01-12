"use client";

import {
  Phone,
  Mail,
  MapPin,
  Car,
  X,
  Edit,
  Trash2,
  Briefcase,
  Calendar,
  User,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomerWithStats {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalJobs: number;
  lastVisit: Date | null;
  vehicleCount: number;
  vehicles: Array<{ make: string | null; model: string | null }>;
}

interface CustomerDetailDialogProps {
  customer: CustomerWithStats | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: CustomerWithStats) => void;
  onDelete: (customer: CustomerWithStats) => void;
  onCreateJob?: (customer: CustomerWithStats) => void;
}

export function CustomerDetailDialog({
  customer,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCreateJob,
}: CustomerDetailDialogProps) {
  if (!customer || !isOpen) return null;

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
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {customer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-foreground">
                      {customer.name}
                    </h2>
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    >
                      Active Customer
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Customer since{" "}
                      {customer.lastVisit
                        ? customer.lastVisit.toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
              <div className="border-b border-border px-6 flex-none">
                <TabsList className="h-12 bg-transparent border-0 p-0 gap-6">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 h-12"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="vehicles"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 h-12"
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Vehicles ({customer.vehicleCount})
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="overview" className="m-0 p-6 space-y-6">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customer.phone && (
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Phone
                            </p>
                            <p className="font-medium text-foreground">
                              {customer.phone}
                            </p>
                          </div>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Email
                            </p>
                            <p className="font-medium text-foreground">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    {customer.address && (
                      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Address
                          </p>
                          <p className="font-medium text-foreground">
                            {customer.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Statistics */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Statistics
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          {customer.totalJobs}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Jobs
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Car className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          {customer.vehicleCount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Vehicles
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <History className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {customer.lastVisit
                            ? customer.lastVisit.toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })
                            : "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last Visit
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="vehicles" className="m-0 p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Registered Vehicles
                  </h3>
                  {customer.vehicles.length > 0 ? (
                    <div className="space-y-3">
                      {customer.vehicles.map((vehicle, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border hover:border-primary/30 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Car className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {vehicle.make && vehicle.model
                                ? `${vehicle.make} ${vehicle.model}`
                                : "Unknown Vehicle"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Registered vehicle
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No vehicles registered for this customer
                      </p>
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
                    onClick={() => onCreateJob(customer)}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Create New Job
                  </Button>
                )}
                <div className="flex gap-2 flex-1">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onEdit(customer)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => onDelete(customer)}
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
