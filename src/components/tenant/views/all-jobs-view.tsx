"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  MoreHorizontal,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { type UIJob } from "@/modules/job/application/job-transforms-service";
import { type JobStatus, statusConfig } from "@/modules/job/domain/job.entity";
import { cn } from "@/lib/utils";

interface AllJobsViewProps {
  jobs: UIJob[];
  onJobClick: (job: UIJob) => void;
}

type SortField = "jobNumber" | "createdAt" | "customer" | "vehicle" | "status";
type SortOrder = "asc" | "desc";

export function AllJobsView({ jobs, onJobClick }: AllJobsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const filteredAndSortedJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        job.jobNumber.toLowerCase().includes(query) ||
        job.customer.name.toLowerCase().includes(query) ||
        job.vehicle.regNo.toLowerCase().includes(query) ||
        job.vehicle.make.toLowerCase().includes(query) ||
        job.vehicle.model.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" || job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "jobNumber":
          comparison = a.jobNumber.localeCompare(b.jobNumber);
          break;
        case "createdAt": {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as any);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt as any);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        }
        case "customer":
          comparison = a.customer.name.localeCompare(b.customer.name);
          break;
        case "vehicle":
          comparison = `${a.vehicle.make} ${a.vehicle.model}`.localeCompare(
            `${b.vehicle.make} ${b.vehicle.model}`,
          );
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [jobs, searchQuery, statusFilter, sortField, sortOrder]);

  const stats = useMemo(() => {
    return {
      total: jobs.length,
      received: jobs.filter((j) => j.status === "received").length,
      working: jobs.filter((j) => j.status === "working").length,
      ready: jobs.filter((j) => j.status === "ready").length,
      completed: jobs.filter((j) => j.status === "completed").length,
    };
  }, [jobs]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "Job Number",
      "Customer",
      "Phone",
      "Vehicle",
      "Reg No",
      "Mechanic",
      "Status",
      "Created Date",
      "Total Amount",
    ];
    const csvRows = [headers.join(",")];

    filteredAndSortedJobs.forEach((job) => {
      const total = (job as any).partsTotal + (job as any).laborTotal + (job as any).tax;
      const createdDate = (
        job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt as any)
      ).toLocaleDateString("en-IN");

      const row = [
        job.jobNumber,
        `"${job.customer.name}"`,
        job.customer.phone || "",
        `"${job.vehicle.make} ${job.vehicle.model}"`,
        job.vehicle.regNo,
        job.mechanic ? `"${job.mechanic.name}"` : "Unassigned",
        statusConfig[job.status as JobStatus].label,
        createdDate,
        total > 0 ? total.toString() : "0",
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `jobs_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-foreground">All Jobs</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Manage and track all job cards</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent w-fit" onClick={handleExportCSV}>
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span> CSV
        </Button>
      </div>

      {/* Stats Grid - responsive: 3 on first row, 2 on second for mobile */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
        {[
          { label: "Total Jobs", value: stats.total, color: "bg-primary/10 text-primary" },
          { label: "Received", value: stats.received, color: "bg-blue-500/10 text-blue-500" },
          { label: "Working", value: stats.working, color: "bg-amber-500/10 text-amber-500" },
          { label: "Ready", value: stats.ready, color: "bg-emerald-500/10 text-emerald-500" },
          { label: "Completed", value: stats.completed, color: "bg-slate-500/10 text-slate-400" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "bg-card border border-border rounded-xl p-2 md:p-4",
              index >= 3 && "col-span-1 md:col-span-1" // Last two take normal width on mobile
            )}
          >
            <div className="text-[10px] md:text-sm text-muted-foreground truncate">{stat.label}</div>
            <div className={`text-lg md:text-2xl font-bold mt-0.5 md:mt-1 ${stat.color.split(" ")[1]}`}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filter - stack on mobile */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search jobs, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 md:h-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as JobStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-48 h-9 md:h-10">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table with horizontal scroll on mobile */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table aria-label="All Jobs" className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("jobNumber")}
                aria-sort={sortField === "jobNumber" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
              >
                <div className="flex items-center">
                  Job # <SortIndicator field="jobNumber" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("customer")}
                aria-sort={sortField === "customer" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
              >
                <div className="flex items-center">
                  Customer <SortIndicator field="customer" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("vehicle")}
                aria-sort={sortField === "vehicle" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
              >
                <div className="flex items-center">
                  Vehicle <SortIndicator field="vehicle" />
                </div>
              </TableHead>
              <TableHead>Mechanic</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("status")}
                aria-sort={sortField === "status" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
              >
                <div className="flex items-center">
                  Status <SortIndicator field="status" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("createdAt")}
                aria-sort={sortField === "createdAt" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
              >
                <div className="flex items-center">
                  Created <SortIndicator field="createdAt" />
                </div>
              </TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedJobs.map((job, index) => {
              const status = statusConfig[job.status as JobStatus];
              const total = (job as any).partsTotal + (job as any).laborTotal + (job as any).tax;

              return (
                <motion.tr
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group cursor-pointer hover:bg-muted/50"
                  onClick={() => onJobClick(job)}
                >
                  <TableCell className="font-mono font-medium">{job.jobNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{job.customer.name}</div>
                      <div className="text-sm text-muted-foreground">{job.customer.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {job.vehicle.make} {job.vehicle.model}
                      </div>
                      <div className="text-sm text-muted-foreground">{job.vehicle.regNo}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.mechanic ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={job.mechanic.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {job.mechanic.name ? job.mechanic.name.charAt(0) : "M"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{job.mechanic.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${status.bgColor} ${status.color} border-0`}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Calendar className="w-3 h-3" />
                      {(
                        job.createdAt instanceof Date
                          ? job.createdAt
                          : new Date(job.createdAt as any)
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onJobClick(job);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
        </div>
        {filteredAndSortedJobs.length === 0 && (
          <div className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Filter className="size-6" />
              </EmptyMedia>
              <EmptyContent>
                <EmptyTitle>No jobs found</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your search or filters to find what you're looking for.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          </div>
        )}
      </div>
    </div>
  );
}
