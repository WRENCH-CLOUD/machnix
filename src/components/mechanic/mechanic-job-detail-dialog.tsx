"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Clock,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Circle,
  MessageSquare,
  Camera,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { type DVIItem, type JobStatus } from "@/modules/job/domain/job.entity";
import { cn } from "@/lib/utils";
import { statusConfig } from "./mechanic-job-card";
import {
  statusFlow,
  type MechanicJobDetailProps,
} from "@/modules/mechanic/domain/mechanic-view.repository";

export function MechanicJobDetailDialog({
  job,
  activeTab,
  onTabChange,
  onClose,
  currentStatus,
  onStatusUpdate,
  dviItems,
  onDviItemStatusChange,
  onDviItemNoteAdd,
}: MechanicJobDetailProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [itemNote, setItemNote] = useState("");

  const statusInfo = statusConfig[currentStatus] || statusConfig.received;

  const currentStatusIndex = statusFlow.indexOf(currentStatus);
  const canMoveForward =
    currentStatusIndex < statusFlow.length - 1 && currentStatusIndex >= 1;
  const canMoveBackward = currentStatusIndex > 1;

  const groupedDviItems = dviItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, DVIItem[]>);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="h-full flex flex-col"
      >
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 safe-area-inset-top">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={onClose}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-foreground">{job.jobNumber}</h1>
              <p className="text-sm text-muted-foreground">
                {job.vehicle.make} {job.vehicle.model} • {job.vehicle.regNo}
              </p>
            </div>
            <Badge
              className={cn(
                "text-xs px-3 py-1",
                statusInfo.bgColor,
                statusInfo.color,
                "border-0"
              )}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-card border-b border-border px-4">
          <div className="flex gap-1">
            {[
              { id: "status" as const, label: "Status", icon: Clock },
              { id: "dvi" as const, label: "Inspection", icon: ClipboardCheck },
              { id: "info" as const, label: "Details", icon: Car },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all",
                  "border-b-2",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {/* Status Tab */}
          {activeTab === "status" && (
            <div className="p-4 space-y-6">
              {/* Current Status Display */}
              <Card className="overflow-hidden">
                <div className={cn("p-6 text-center", statusInfo.bgColor)}>
                  <Clock
                    className={cn("w-12 h-12 mx-auto mb-3", statusInfo.color)}
                  />
                  <h2 className={cn("text-2xl font-bold", statusInfo.color)}>
                    {statusInfo.label}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current job status
                  </p>
                </div>
              </Card>

              {/* Status Flow */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Update Status
                </h3>

                <div className="space-y-3">
                  {statusFlow.map((status, index) => {
                    const info = statusConfig[status];
                    const isCurrentOrPast = index <= currentStatusIndex;
                    const isCurrent = status === currentStatus;

                    return (
                      <div
                        key={status}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                          isCurrent
                            ? "border-primary bg-primary/10"
                            : isCurrentOrPast
                            ? "border-border bg-secondary/30"
                            : "border-border/50 opacity-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isCurrent
                              ? "bg-primary text-primary-foreground"
                              : info.bgColor
                          )}
                        >
                          {isCurrentOrPast ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              "font-semibold",
                              isCurrent ? "text-primary" : "text-foreground"
                            )}
                          >
                            {info.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Step {index + 1} of {statusFlow.length}
                          </p>
                        </div>
                        {isCurrent && (
                          <Badge className="bg-primary text-primary-foreground">
                            Current
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-3 pt-4">
                {canMoveForward && (
                  <Button
                    className="w-full h-14 text-lg font-semibold gap-2"
                    onClick={() =>
                      onStatusUpdate(statusFlow[currentStatusIndex + 1])
                    }
                  >
                    <ChevronRight className="w-5 h-5" />
                    Move to{" "}
                    {statusConfig[statusFlow[currentStatusIndex + 1]].label}
                  </Button>
                )}

                {canMoveBackward && (
                  <Button
                    variant="outline"
                    className="w-full h-12 bg-transparent"
                    onClick={() =>
                      onStatusUpdate(statusFlow[currentStatusIndex - 1])
                    }
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to{" "}
                    {statusConfig[statusFlow[currentStatusIndex - 1]].label}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* DVI Tab */}
          {activeTab === "dvi" && (
            <div className="p-4 space-y-4">
              {/* DVI Summary */}
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(dviStatusConfig).map(([key, config]) => {
                  // FIXME: create and or if exsist import dviStatusConfig
                  const count = dviItems.filter((i) => i.status === key).length;
                  return (
                    <Card
                      key={key}
                      className={cn("p-3 text-center", config.bg)}
                    >
                      <config.icon
                        className={cn("w-5 h-5 mx-auto mb-1", config.color)}
                      />
                      <p className={cn("text-lg font-bold", config.color)}>
                        {count}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {config.label}
                      </p>
                    </Card>
                  );
                })}
              </div>

              {/* DVI Items by Category */}
              {Object.entries(groupedDviItems).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {category}
                  </h3>

                  <div className="space-y-3">
                    {items.map((item) => {
                      const statusConf =
                        dviStatusConfig[
                          item.status as keyof typeof dviStatusConfig
                        ];
                      const StatusIcon = statusConf.icon;
                      const isExpanded = expandedItem === item.id;

                      return (
                        <Card key={item.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            {/* Item Header */}
                            <div className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <StatusIcon
                                  className={cn("w-6 h-6", statusConf.color)}
                                />
                                <span className="font-medium text-foreground flex-1">
                                  {item.name}
                                </span>
                              </div>

                              {item.note && (
                                <p className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded-lg mb-3">
                                  {item.note}
                                </p>
                              )}

                              {/* Status Buttons - Large Touch Targets */}
                              <div className="grid grid-cols-4 gap-2">
                                {(
                                  [
                                    "good",
                                    "attention",
                                    "urgent",
                                    "pending",
                                  ] as const
                                ).map((status) => {
                                  const conf = dviStatusConfig[status];
                                  const Icon = conf.icon;
                                  const isActive = item.status === status;

                                  return (
                                    <button
                                      key={status}
                                      onClick={() =>
                                        onDviItemStatusChange(item.id, status)
                                      }
                                      className={cn(
                                        "h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all",
                                        "border-2 active:scale-95",
                                        isActive
                                          ? `${conf.activeBg} border-transparent text-white`
                                          : `${conf.bg} border-transparent ${conf.color}`
                                      )}
                                    >
                                      <Icon className="w-5 h-5" />
                                      <span className="text-[10px] font-semibold uppercase">
                                        {conf.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex border-t border-border">
                              <button
                                onClick={() =>
                                  setExpandedItem(isExpanded ? null : item.id)
                                }
                                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Add Note
                              </button>
                              <div className="w-px bg-border" />
                              <button className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors">
                                <Camera className="w-4 h-4" />
                                Add Photo
                              </button>
                            </div>

                            {/* Expanded Note Input */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-border overflow-hidden"
                                >
                                  <div className="p-4 space-y-3">
                                    <Textarea
                                      placeholder="Enter inspection note..."
                                      value={itemNote}
                                      onChange={(e) =>
                                        setItemNote(e.target.value)
                                      }
                                      className="min-h-[80px] text-base"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        onClick={() => {
                                          setExpandedItem(null);
                                          setItemNote("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        className="flex-1"
                                        onClick={() => {
                                          onDviItemNoteAdd(item.id, itemNote);
                                          setItemNote("");
                                          setExpandedItem(null);
                                        }}
                                      >
                                        Save Note
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}

              {dviItems.length === 0 && (
                <Card className="p-8 text-center">
                  <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground">
                    No Inspection Items
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No DVI items have been added to this job yet
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Info Tab - Read Only */}
          {activeTab === "info" && (
            <div className="p-4 space-y-4">
              {/* Vehicle Info Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Vehicle Details
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Read-only information
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Make</span>
                      <span className="font-medium text-foreground">
                        {job.vehicle.make}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-medium text-foreground">
                        {job.vehicle.model}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Year</span>
                      <span className="font-medium text-foreground">
                        {job.vehicle.year}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Reg No</span>
                      <span className="font-mono font-medium text-foreground">
                        {job.vehicle.regNo}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Color</span>
                      <span className="font-medium text-foreground">
                        {job.vehicle.color}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info Card - Read Only */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Customer
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Contact for reference only
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium text-foreground">
                        {job.customer.name}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 items-center">
                      <span className="text-muted-foreground">Phone</span>
                      <a
                        href={`tel:${job.customer.phone}`}
                        className="flex items-center gap-2 text-primary font-medium"
                      >
                        <Phone className="w-4 h-4" />
                        {job.customer.phone}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Complaint Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Customer Complaint
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Issue to resolve
                      </p>
                    </div>
                  </div>

                  <p className="text-foreground bg-secondary/50 p-4 rounded-xl">
                    {job.complaints}
                  </p>
                </CardContent>
              </Card>

              {/* Job Timeline */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-4">
                    Activity Timeline
                  </h3>

                  <div className="space-y-4">
                    {job.activities && job.activities.length > 0 ? (
                      job.activities
                        .slice(-5)
                        .reverse()
                        .map((activity: any, index: number) => (
                          <div key={activity.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                              {index <
                                Math.min(job.activities.length, 5) - 1 && (
                                <div className="w-px h-full bg-border flex-1 my-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-sm text-foreground">
                                {activity.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.timestamp).toLocaleString(
                                  "en-IN"
                                )}
                              </p>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No recent activity
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
}
