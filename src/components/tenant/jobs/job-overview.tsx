"use client";

import { Phone, Mail, MapPin, Car, User, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type UIJob } from "@/modules/job/application/job-transforms-service";
import { enrichJobWithDummyData } from "@/shared/utils/dvi-dummy-data";

interface JobOverviewProps {
  job: UIJob;
}

export function JobOverview({ job }: JobOverviewProps) {
  // Enrich job with dummy data if needed (legacy behavior)
  const enrichedJob = enrichJobWithDummyData(job);

  // Calculate totals
  const partsSubtotal = job.partsTotal || 0;
  const laborSubtotal = job.laborTotal || 0;
  const total = partsSubtotal + laborSubtotal + (job.tax || 0);

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="p-6 grid grid-cols-3 gap-6">
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
              <p className="font-medium text-foreground">{job.customer.name}</p>
            </div>
            <a
              href={`tel:${job.customer.phone}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Phone className="w-4 h-4" />
              {job.customer.phone}
            </a>
            <a
              href={`mailto:${job.customer.email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Mail className="w-4 h-4" />
              {job.customer.email}
            </a>
            {job.customer.address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5" />
                {job.customer.address}
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Make</span>
              <span className="font-medium">{job.vehicle.make}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium">{job.vehicle.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Year</span>
              <span className="font-medium">{job.vehicle.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reg No</span>
              <span className="font-mono font-medium">{job.vehicle.regNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Color</span>
              <span className="font-medium">{job.vehicle.color || "N/A"}</span>
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
              <div className="flex items-center gap-3">
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
                <div>
                  <p className="font-medium">{job.mechanic.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.mechanic.specialty || "Mechanic"}
                  </p>
                  <a
                    href={`tel:${job.mechanic.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {job.mechanic.phone}
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

        {/* Complaints */}
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Customer Complaint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{job.complaints}</p>
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

        {/* Activity Timeline */}
        <Card className="col-span-3">
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
