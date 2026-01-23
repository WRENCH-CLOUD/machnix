"use client";

import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Car, User, Clock, FileText, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { type UIJob } from "@/modules/job/application/job-transforms-service";
import { enrichJobWithDummyData } from "@/shared/utils/dvi-dummy-data";
import { JobTodos } from "./job-todos";
import { type TodoItem, type TodoStatus } from "@/modules/job/domain/todo.types";
import { VehicleServiceHistory } from "./vehicle-service-history";
import { cn } from "@/lib/utils";

interface JobOverviewProps {
  job: UIJob;
  todos?: TodoItem[];
  onAddTodo?: (text: string) => void;
  onToggleTodo?: (todoId: string) => void;
  onRemoveTodo?: (todoId: string) => void;
  onUpdateTodo?: (todoId: string, text: string) => void;
  onUpdateTodoStatus?: (todoId: string, status: TodoStatus) => void;
  notes?: string;
  onUpdateNotes?: (notes: string) => void;
  onViewJob?: (jobId: string) => void;
  isEditable?: boolean;
  // Estimate data for real-time Job Summary
  estimate?: {
    parts_total?: number;
    labor_total?: number;
    tax_amount?: number;
    total_amount?: number;
  };
}

export function JobOverview({
  job,
  todos = [],
  onAddTodo,
  onToggleTodo,
  onRemoveTodo,
  onUpdateTodo,
  onUpdateTodoStatus,
  notes,
  onUpdateNotes,
  onViewJob,
  isEditable = true,
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
            <div>
              <p className="font-medium text-foreground wrap-break-word">{job.customer.name}</p>
            </div>
            <a
              href={`tel:${job.customer.phone}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline min-w-0"
            >
              <Phone className="w-4 h-4" />
              <span className="truncate">{job.customer.phone}</span>
            </a>
            <a
              href={`mailto:${job.customer.email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground min-w-0"
            >
              <Mail className="w-4 h-4" />
              <span className="truncate">{job.customer.email}</span>
            </a>
            {job.customer.address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground min-w-0">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span className="wrap-break-word">{job.customer.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Car className="w-4 h-4" />
              Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between gap-3 min-w-0">
              <span className="text-muted-foreground shrink-0">Make</span>
              <span className="font-medium min-w-0 text-right truncate">{job.vehicle.make}</span>
            </div>
            <div className="flex items-center justify-between gap-3 min-w-0">
              <span className="text-muted-foreground shrink-0">Model</span>
              <span className="font-medium min-w-0 text-right truncate">{job.vehicle.model}</span>
            </div>
            <div className="flex items-center justify-between gap-3 min-w-0">
              <span className="text-muted-foreground shrink-0">Year</span>
              <span className="font-medium min-w-0 text-right truncate">{job.vehicle.year}</span>
            </div>
            <div className="flex items-center justify-between gap-3 min-w-0">
              <span className="text-muted-foreground shrink-0">Reg No</span>
              <span className="font-mono font-medium min-w-0 text-right truncate">{job.vehicle.regNo}</span>
            </div>
            <div className="flex items-center justify-between gap-3 min-w-0">
              <span className="text-muted-foreground shrink-0">Color</span>
              <span className="font-medium min-w-0 text-right truncate">{job.vehicle.color || "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Mechanic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Assigned Mechanic
            </CardTitle>
          </CardHeader>
          <CardContent>
            {job.mechanic ? (
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={job.mechanic.avatar || "/placeholder.svg"}
                  />
                  <AvatarFallback>
                    {job.mechanic.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">{job.mechanic.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.mechanic.specialty || "Mechanic"}
                  </p>
                  <a
                    href={`tel:${job.mechanic.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    <span className="truncate">{job.mechanic.phone}</span>
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                No mechanic assigned
              </p>
            )}
          </CardContent>
        </Card>

        {/* Task List - Primary */}
        {onAddTodo && onToggleTodo && onRemoveTodo && onUpdateTodo && (
          <JobTodos
            todos={todos}
            onAddTodo={onAddTodo}
            onToggleTodo={onToggleTodo}
            onRemoveTodo={onRemoveTodo}
            onUpdateTodo={onUpdateTodo}
            onUpdateTodoStatus={onUpdateTodoStatus}
            disabled={!isEditable}
            className="md:col-span-2"
          />
        )}

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
                enrichedJob.activities.map((activity: any, index: number) => (
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
