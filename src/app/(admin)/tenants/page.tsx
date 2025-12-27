"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  MoreHorizontal,
  Search,
  LogIn,
  RefreshCw,
  Plus,
  Eye,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  type TenantWithStats,
  // GetAllTenantsWithStatsUseCase,
  // GetTenantWithStatsUseCase,
  // SupabaseTenantRepository,
} from "@/modules/tenant"
import { Spinner } from "@/components/ui/spinner";
import { TenantDetailsDialog } from "@/features/admin/tenant-details-dialog";
import { CreateTenantDialog } from "@/features/admin/create-tenant-dialog";

export default function TenantsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tenants, setTenants] = useState<TenantWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithStats | null>(
    null
  );
  const [tenantDetailsLoading, setTenantDetailsLoading] = useState(false);
  const [tenantDetailsError, setTenantDetailsError] = useState<string | null>(
    null
  );
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [showCreateTenant, setShowCreateTenant] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from admin API
      const response = await fetch('/api/admin/tenants');
      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }
      const { tenants } = await response.json();

      setTenants(tenants as TenantWithStats[]);
    } catch (err) {
      console.error("Failed to load tenants:", err);
      setError("Failed to load tenants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setShowTenantDetails(true);
    setTenantDetailsLoading(true);
    setTenantDetailsError(null);

    try {
      // Fetch single tenant details from admin API
      const response = await fetch(`/api/admin/tenants/${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tenant details');
      }
      const { tenant } = await response.json();
      setSelectedTenant(tenant as TenantWithStats);
    } catch (err) {
      console.error("Failed to load tenant details:", err);
      setTenantDetailsError("Failed to load tenant details");
    } finally {
      setTenantDetailsLoading(false);
    }
  };

  const handleCreateTenantSuccess = () => {
    loadTenants();
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, tenants]);

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    suspended: "bg-red-500/10 text-red-500 border-red-500/20",
    trial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  const subscriptionColors: Record<string, string> = {
    starter: "bg-slate-500/10 text-slate-400",
    pro: "bg-primary/10 text-primary",
    enterprise: "bg-purple-500/10 text-purple-500",
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tenant Management</CardTitle>
              <CardDescription>
                Detailed tenant administration and management
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCreateTenant(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Tenant
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={loadTenants}
                disabled={loading}
              >
                <RefreshCw
                  className={cn("w-4 h-4", loading && "animate-spin")}
                />
              </Button>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={loadTenants} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Building2 className="w-12 h-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No tenants found matching your search"
                  : "No tenants registered yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Job Stats</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Mechanics</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant, index) => {
                  const totalJobs =
                    (tenant.active_jobs || 0) + (tenant.completed_jobs || 0);
                  const completionRate =
                    totalJobs > 0
                      ? ((tenant.completed_jobs || 0) / totalJobs) * 100
                      : 0;

                  return (
                    <motion.tr
                      key={tenant.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{tenant.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Since{" "}
                              {new Date(tenant.createdAt).toLocaleDateString(
                                "en-IN",
                                { month: "short", year: "numeric" }
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[tenant.status || "active"]}
                        >
                          {(tenant.status || "active").charAt(0).toUpperCase() +
                            (tenant.status || "active").slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            subscriptionColors[tenant.subscription || "pro"]
                          }
                        >
                          {(tenant.subscription || "pro")
                            .charAt(0)
                            .toUpperCase() +
                            (tenant.subscription || "pro").slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {tenant.customer_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              {tenant.active_jobs || 0} active
                            </span>
                            <span className="text-muted-foreground">
                              {tenant.completed_jobs || 0} done
                            </span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-emerald-500">
                          ₹{((tenant.total_revenue || 0) / 100000).toFixed(1)}L
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{tenant.mechanic_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
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
                              onClick={() => handleViewDetails(tenant.id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <LogIn className="w-4 h-4 mr-2" />
                              Login as Tenant
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Manage Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TenantDetailsDialog
        tenant={selectedTenant}
        loading={tenantDetailsLoading}
        error={tenantDetailsError}
        open={showTenantDetails}
        onOpenChange={setShowTenantDetails}
      />
      <CreateTenantDialog
        open={showCreateTenant}
        onOpenChange={setShowCreateTenant}
        onSuccess={handleCreateTenantSuccess}
      />
    </div>
  );
}
