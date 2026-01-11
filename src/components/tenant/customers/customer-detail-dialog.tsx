"use client";

import { Phone, Mail, MapPin, Car, X, Edit, Trash2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

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
  if (!customer) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {customer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl">{customer.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-1">
                Customer since{" "}
                {customer.lastVisit
                  ? customer.lastVisit.toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Contact Information
          </h3>
          <div className="space-y-3">
            {customer.phone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{customer.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold">{customer.totalJobs}</div>
              <div className="text-xs text-muted-foreground">Total Jobs</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Car className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold">{customer.vehicleCount}</div>
              <div className="text-xs text-muted-foreground">Vehicles</div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Vehicles */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Registered Vehicles
          </h3>
          {customer.vehicles.length > 0 ? (
            <div className="space-y-2">
              {customer.vehicles.map((vehicle, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <Car className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">
                    {vehicle.make && vehicle.model
                      ? `${vehicle.make} ${vehicle.model}`
                      : "Unknown Vehicle"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No vehicles registered
            </p>
          )}
        </div>

        <Separator className="my-4" />

        {/* Actions */}
        <div className="space-y-3">
          {onCreateJob && (
            <Button
              className="w-full"
              onClick={() => onCreateJob(customer)}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Create New Job
            </Button>
          )}
          <div className="flex gap-2">
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
      </SheetContent>
    </Sheet>
  );
}
