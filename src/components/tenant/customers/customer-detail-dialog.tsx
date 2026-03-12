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
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface CustomerWithStats {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalJobs: number;
  lastVisit: Date | null;
  vehicleCount: number;
  vehicles: Array<{ make: string | null; model: string | null; regNo?: string | null }>;
}

interface CustomerDetailDialogProps {
  customer: CustomerWithStats | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: CustomerWithStats) => void;
  onDelete: (customer: CustomerWithStats) => void;
  onCreateJob?: (customer: CustomerWithStats) => void;
}

function padNumber(n: number): string {
  return n.toString().padStart(2, "0");
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-full sm:max-w-[540px] p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh] rounded-2xl bg-card"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Customer Details</DialogTitle>
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

          <Avatar className="w-20 h-20 border-2 border-border mb-4">
            <AvatarFallback className="bg-muted text-foreground text-2xl font-bold tracking-wider">
              {customer.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-foreground">
              {customer.name}
            </h2>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
            >
              Active Member
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Client since{" "}
              {customer.lastVisit
                ? customer.lastVisit.toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 flex-none">
            <TabsList className="h-10 bg-transparent border-0 p-0 gap-6">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground rounded-none px-0 h-10 text-sm font-semibold"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="vehicles"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground rounded-none px-0 h-10 text-sm text-muted-foreground data-[state=active]:text-foreground"
              >
                Vehicles ({customer.vehicleCount})
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground rounded-none px-0 h-10 text-sm text-muted-foreground data-[state=active]:text-foreground"
              >
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="overview" className="m-0 px-6 pt-6 pb-4 space-y-6">
              {/* Communication */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                  Communication
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customer.phone && (
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-xl border border-border/50">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mb-0.5">
                          Mobile
                        </p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {customer.phone}
                        </p>
                      </div>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-xl border border-border/50">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mb-0.5">
                          Email
                        </p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {customer.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {customer.address && (
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-xl border border-border/50">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mb-0.5">
                        Address
                      </p>
                      <p className="text-sm font-medium text-foreground truncate">
                        {customer.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/40 border border-border/50 rounded-xl p-4 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-foreground tracking-tight">
                      {padNumber(customer.totalJobs)}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mt-1">
                      Total Jobs
                    </div>
                  </div>
                  <div className="bg-muted/40 border border-border/50 rounded-xl p-4 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center">
                      <Car className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-foreground tracking-tight">
                      {padNumber(customer.vehicleCount)}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mt-1">
                      Vehicles
                    </div>
                  </div>
                  <div className="bg-muted/40 border border-border/50 rounded-xl p-4 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-lg font-bold text-foreground tracking-tight">
                      {customer.lastVisit
                        ? customer.lastVisit.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })
                        : "N/A"}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mt-1">
                      Last Engagement
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vehicles" className="m-0 px-6 pt-6 pb-4 space-y-3">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                Registered Vehicles
              </h3>
              {customer.vehicles.length > 0 ? (
                <div className="space-y-2">
                  {customer.vehicles.map((vehicle, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-xl border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {vehicle.make && vehicle.model
                            ? `${vehicle.make} ${vehicle.model}`
                            : "Unknown Vehicle"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.regNo ? vehicle.regNo : "No number plate"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Car className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No vehicles registered
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="m-0 px-6 pt-6 pb-4">
              <div className="text-center py-12">
                <History className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No history available
                </p>
              </div>
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
                onClick={() => onCreateJob(customer)}
              >
                Create Job
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-5 text-xs font-semibold uppercase tracking-wider h-9"
              onClick={() => onEdit(customer)}
            >
              Modify Details
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-full px-5 text-xs font-semibold uppercase tracking-wider h-9 ml-auto"
              onClick={() => onDelete(customer)}
            >
              Delete Customer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
