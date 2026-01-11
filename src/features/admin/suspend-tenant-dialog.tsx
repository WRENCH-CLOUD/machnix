"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type TenantWithStats } from "@/modules/tenant";
import { useToast } from "@/hooks/use-toast";

interface SuspendTenantDialogProps {
  tenant: TenantWithStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SuspendTenantDialog({
  tenant,
  open,
  onOpenChange,
  onSuccess,
}: SuspendTenantDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSuspend = async () => {
    if (!tenant) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/admin/tenants/${tenant.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to suspend tenant");
      }

      toast({
        title: "Tenant Suspended",
        description: `${tenant.name} has been suspended successfully.`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to suspend tenant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Suspend Tenant
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to suspend this tenant?
          </DialogDescription>
        </DialogHeader>

        {tenant && (
          <div className="space-y-4 py-4">
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertDescription className="text-sm">
                Suspending <span className="font-semibold">{tenant.name}</span>{" "}
                will prevent them from accessing their dashboard and services.
                This action can be reversed.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Tenant:</span>
                <span className="ml-2 font-medium">{tenant.name}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Current Status:</span>
                <span className="ml-2 font-medium capitalize">
                  {tenant.status || "active"}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSuspend}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
            {loading ? "Suspending..." : "Suspend Tenant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
