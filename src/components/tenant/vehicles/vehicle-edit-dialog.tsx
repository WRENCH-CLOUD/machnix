"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface VehicleFormData {
  make: string;
  model: string;
  regNo: string;
  year: string;
  color: string;
  odometer: string;
}

interface VehicleEditDialogProps {
  vehicle: {
    id: string;
    makeName: string;
    modelName: string;
    regNo: string;
    year?: number;
    color?: string;
    odometer?: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: VehicleFormData) => Promise<void>;
  makes?: { id: string; name: string }[];
}

export function VehicleEditDialog({
  vehicle,
  isOpen,
  onClose,
  onSave,
  makes = [],
}: VehicleEditDialogProps) {
  const [formData, setFormData] = useState<VehicleFormData>({
    make: "",
    model: "",
    regNo: "",
    year: "",
    color: "",
    odometer: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.makeName || "",
        model: vehicle.modelName || "",
        regNo: vehicle.regNo || "",
        year: vehicle.year?.toString() || "",
        color: vehicle.color || "",
        odometer: vehicle.odometer?.toString() || "",
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    // Validation
    if (!formData.regNo.trim()) {
      setError("Registration number is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(vehicle.id, formData);
      onClose();
    } catch (err) {
      console.error("Error saving vehicle:", err);
      setError(err instanceof Error ? err.message : "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update vehicle information below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                {makes.length > 0 ? (
                  <Select
                    value={formData.make}
                    onValueChange={(val) =>
                      setFormData({ ...formData, make: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      {makes.map((make) => (
                        <SelectItem key={make.id} value={make.name}>
                          {make.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) =>
                      setFormData({ ...formData, make: e.target.value })
                    }
                    placeholder="Enter make"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  placeholder="Enter model"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regNo">
                  Registration No. <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="regNo"
                  value={formData.regNo}
                  onChange={(e) =>
                    setFormData({ ...formData, regNo: e.target.value })
                  }
                  placeholder="KA 01 AB 1234"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  placeholder="2024"
                  min="1900"
                  max="2030"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="Enter color"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odometer">Odometer (km)</Label>
                <Input
                  id="odometer"
                  type="number"
                  value={formData.odometer}
                  onChange={(e) =>
                    setFormData({ ...formData, odometer: e.target.value })
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
