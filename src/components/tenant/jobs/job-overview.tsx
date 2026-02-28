"use client";

import { useState, useEffect } from "react";
import { Phone, Mail, Car, User, Clock, FileText, Save, HardHat, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { type UIJob } from "@/modules/job/application/job-transforms-service";
import { enrichJobWithDummyData } from "@/shared/utils/dvi-dummy-data";
import { VehicleServiceHistory } from "./vehicle-service-history";
import { MechanicSelect } from "./mechanic-select";
import { cn } from "@/lib/utils";


/** Minimal inventory item shape for search function */
type InventorySearchItem = {
  id: string;
  name: string;
  sellPrice?: number;
  unitCost?: number;
  stockOnHand?: number;
  stockReserved?: number;
  stockAvailable?: number;
  stockKeepingUnit?: string;
};

interface JobOverviewProps {
  job: UIJob;
  notes?: string;
  onUpdateNotes?: (notes: string) => void;
  onViewJob?: (jobId: string) => void;
  isEditable?: boolean;
  // Mechanic assignment
  onMechanicChange?: (mechanicId: string) => void;
  // Estimate data for real-time Job Summary
  estimate?: {
    parts_total?: number;
    labor_total?: number;
    tax_amount?: number;
    total_amount?: number;
  } | null;
  // For task system: inventory search function (accepts both full items and snapshot items)
  searchInventory?: (query: string, limit?: number) => InventorySearchItem[];
}

export function JobOverview({
  job,
  notes,
  onUpdateNotes,
  onViewJob,
  isEditable = true,
  onMechanicChange,
  estimate,
}: JobOverviewProps) {
  // Enrich job with dummy data if needed (legacy behavior)
  const enrichedJob = enrichJobWithDummyData(job);

  // Local state for notes editing
  const [localNotes, setLocalNotes] = useState(notes ?? job.complaints ?? "");
  const [isNotesEditing, setIsNotesEditing] = useState(false);
  const [notesDirty, setNotesDirty] = useState(false);

  // Sync local notes when prop changes, but avoid overwriting while editing
  useEffect(() => {
    if (isNotesEditing || notesDirty) {
      return;
    }
    setLocalNotes(notes ?? job.complaints ?? "");
    setNotesDirty(false);
  }, [notes, job.complaints, isNotesEditing, notesDirty]);

  const handleNotesChange = (value: string) => {
    setLocalNotes(value);
    setNotesDirty(value !== (notes ?? job.complaints ?? ""));
  };

  const handleSaveNotes = () => {
    if (onUpdateNotes && notesDirty) {
      onUpdateNotes(localNotes);
      setNotesDirty(false);
      setIsNotesEditing(false);
    }
  };

  // Calculate totals - prefer estimate data for real-time updates, fallback to job data
  const partsSubtotal = estimate?.parts_total ?? job.partsTotal ?? 0;
  const laborSubtotal = estimate?.labor_total ?? job.laborTotal ?? 0;
  const taxAmount = estimate?.tax_amount ?? job.tax ?? 0;
  const total = estimate?.total_amount ?? (partsSubtotal + laborSubtotal + taxAmount);

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Customer Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Customer Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm warp-warp-break-words">{job.customer.name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-mono break-all">{job.customer.phone}</span>
                </div>
                {job.customer.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-all">{job.customer.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Vehicle Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Car className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm warp-break-words">
                    {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-mono break-all">
                    {job.vehicle.regNo}
                  </span>
                </div>
                {job.vehicle.regNo && (
                  <div className="flex items-start gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-mono break-all">
                      {job.vehicle.regNo}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mechanic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HardHat className="w-4 h-4" />
              Assigned Mechanic
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditable && onMechanicChange ? (
              <div className="space-y-3">
                <MechanicSelect
                  value={job.mechanic?.id}
                  onChange={(mechanicId) => {
                    if (mechanicId === "__unassigned__") {
                      // Handle unassign - for now just don't do anything
                      return;
                    }
                    onMechanicChange(mechanicId);
                  }}
                  placeholder="Select mechanic"
                />
                {job.mechanic && (
                  <div className="flex items-center gap-3 min-w-0 p-2 bg-muted/50 rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={job.mechanic.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {job.mechanic.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{job.mechanic.name}</p>
                      {job.mechanic.phone && (
                        <a
                          href={`tel:${job.mechanic.phone}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {job.mechanic.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : job.mechanic ? (
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={job.mechanic.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {job.mechanic.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">{job.mechanic.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.mechanic.specialty || "Mechanic"}
                  </p>
                  {job.mechanic.phone && (
                    <a
                      href={`tel:${job.mechanic.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      <span className="truncate">{job.mechanic.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                No mechanic assigned
              </p>
            )}
          </CardContent>
        </Card>

        {/* Complaints / Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Customer Complaint / Notes
              </div>
              {isEditable && notesDirty && (
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  className="h-7 px-2 gap-1"
                  aria-label="Save notes"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditable && onUpdateNotes ? (
              <Textarea
                value={localNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                onFocus={() => setIsNotesEditing(true)}
                onBlur={() => {
                  if (!notesDirty) setIsNotesEditing(false);
                }}
                placeholder="Add notes or customer complaints..."
                className={cn(
                  "min-h-[80px] resize-none transition-colors",
                  isNotesEditing && "border-primary"
                )}
              />
            ) : (
              <p className="text-foreground wrap-break-word">{localNotes || "No complaints recorded"}</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Job Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="text-sm">
                {new Date(
                  enrichedJob.created_at || enrichedJob.createdAt
                ).toLocaleDateString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Parts</span>
              <span className="font-medium">
                ₹{partsSubtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Labor</span>
              <span className="font-medium">
                ₹{laborSubtotal.toLocaleString()}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Service History */}
        <VehicleServiceHistory
          vehicleId={job.vehicle.id}
          currentJobId={job.id}
          onViewJob={onViewJob}
        />

        {/* Activity Timeline */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrichedJob.activities && enrichedJob.activities.length > 0 ? (
                enrichedJob.activities.map((activity: { id: string; description: string; timestamp: string; user: string }, index: number) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {index < enrichedJob.activities.length - 1 && (
                        <div className="w-px h-full bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-foreground">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {activity.user}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No activity recorded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
