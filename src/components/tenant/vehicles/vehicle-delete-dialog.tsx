"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VehicleDeleteDialogProps {
  vehicle: { id: string; makeName: string; modelName: string; regNo: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function VehicleDeleteDialog({
  vehicle,
  isOpen,
  onClose,
  onConfirm,
}: VehicleDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!vehicle) return;

    try {
      setDeleting(true);
      setError(null);
      await onConfirm(vehicle.id);
      onClose();
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      setError(err instanceof Error ? err.message : "Failed to delete vehicle");
    } finally {
      setDeleting(false);
    }
  };

  const vehicleName = vehicle
    ? `${vehicle.makeName} ${vehicle.modelName} (${vehicle.regNo})`
    : "";

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>{vehicleName}</strong>?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          This action cannot be undone. All service history and associated
          records will be affected.
        </p>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete Vehicle
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
