"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { type TenantWithStats } from "@/modules/tenant";
import { Trash2 } from "lucide-react";

interface DeleteTenantDialogProps {
  tenant: TenantWithStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteTenantDialog({
  tenant,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTenantDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!tenant) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete tenant");
      }

      toast({
        title: "Tenant Deleted",
        description: `${tenant.name} has been permanently deleted`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete tenant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="w-5 h-5 text-destructive" />
            </span>
          </div>
          <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{tenant?.name}</strong>? This action cannot be undone and will permanently remove all associated data including customers, jobs, and invoices.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
            Delete Tenant
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
