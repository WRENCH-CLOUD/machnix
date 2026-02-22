"use client";

import { History, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVehicleJobHistory } from "@/hooks/queries";
import { cn } from "@/lib/utils";

interface VehicleServiceHistoryProps {
    vehicleId: string | undefined;
    currentJobId?: string; // Exclude current job from count
    onViewJob?: (jobId: string) => void;
    compact?: boolean; // For use in create wizard
    className?: string;
}

export function VehicleServiceHistory({
    vehicleId,
    currentJobId,
    onViewJob,
    compact = false,
    className,
}: VehicleServiceHistoryProps) {
    const { data, isLoading, error } = useVehicleJobHistory(vehicleId, currentJobId);

    if (!vehicleId) return null;

    if (isLoading) {
        return (
            <Card className={cn(compact ? "border-dashed" : "", className)}>
                <CardHeader className={cn("pb-3", compact && "py-3")}>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Service History
                    </CardTitle>
                </CardHeader>
                <CardContent className={cn(compact && "pb-3")}>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        console.error('VehicleServiceHistory error:', error);
        return (
            <Card className={cn(compact ? "border-dashed" : "", className)}>
                <CardHeader className={cn("pb-3", compact && "py-3")}>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Service History
                    </CardTitle>
                </CardHeader>
                <CardContent className={cn(compact && "pb-3")}>
                    <p className="text-sm text-muted-foreground italic">
                        Unable to load service history
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Current job is included in totalJobs count, so subtract 1 for "previous visits"
    const adjustedCount = Math.max(0, data.totalJobs - 1);

    // If no previous jobs exist (only the current one)
    if (adjustedCount === 0 || !data.recentJob) {
        return (
            <Card className={cn(compact ? "border-dashed" : "", className)}>
                <CardHeader className={cn("pb-3", compact && "py-3")}>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Service History
                    </CardTitle>
                </CardHeader>
                <CardContent className={cn(compact && "pb-3")}>
                    <p className="text-sm text-muted-foreground italic">
                        First visit for this vehicle
                    </p>
                </CardContent>
            </Card>
        );
    }

    const recentJob = data.recentJob;

    return (
        <Card className={cn(compact ? "border-dashed" : "", className)}>
            <CardHeader className={cn("pb-3", compact && "py-3")}>
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Service History
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {adjustedCount} previous {adjustedCount === 1 ? "visit" : "visits"}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className={cn("space-y-3", compact && "pb-3")}>
                {recentJob && (
                    <div className="space-y-4">
                        <div className="flex items-baseline justify-between border-b pb-2">
                            <h4 className="text-sm font-semibold text-foreground">Last Visit Details</h4>
                            <span className="text-xs font-medium text-muted-foreground">
                                {new Date(recentJob.createdAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        </div>

                        {/* Parts worked on */}
                        <div className="space-y-2">
                            {recentJob.partsWorkedOn.length > 0 ? (
                                <div className="grid grid-cols-1 gap-1.5">
                                    {recentJob.partsWorkedOn.slice(0, compact ? 4 : 6).map((part, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 text-sm text-muted-foreground group"
                                        >
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full shrink-0",
                                                part.status === "changed" ? "bg-blue-400" : "bg-green-400"
                                            )} />
                                            <span className="flex-1 truncate">{part.name}</span>
                                            <Badge variant="outline" className="text-[10px] h-4 px-1 lowercase font-normal border-muted-foreground/20">
                                                {part.status}
                                            </Badge>
                                        </div>
                                    ))}
                                    {recentJob.partsWorkedOn.length > (compact ? 4 : 6) && (
                                        <p className="text-[11px] text-muted-foreground pl-3.5 italic">
                                            + {recentJob.partsWorkedOn.length - (compact ? 4 : 6)} other items
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic pl-1">
                                    No major repairs recorded
                                </p>
                            )}
                        </div>

                        {/* Link to job */}
                        {onViewJob && (
                            <div className="pt-1 flex justify-end">
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs font-medium text-primary hover:no-underline gap-1.5"
                                    onClick={() => onViewJob(recentJob.id)}
                                >
                                    <span>Browse History Entry #{recentJob.jobNumber}</span>
                                    <ExternalLink className="w-3 h-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
