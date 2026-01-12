"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTenantDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTenantDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tenantName: "",
    tenantSlug: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    subscription: "pro",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await fetch("/api/admin/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create tenant");
      }

      toast({
        title: "Success",
        description: data.message || "Tenant created successfully",
      });

      onSuccess();
      onOpenChange(false);
      setFormData({
        tenantName: "",
        tenantSlug: "",
        adminName: "",
        adminEmail: "",
        adminPhone: "",
        subscription: "pro"
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create tenant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              {/* Reuse legacy-style icon from admin create tenant dialog */}
            </span>
            <span>Create New Tenant</span>
          </DialogTitle>
          <DialogDescription>
            Create a new tenant organization with admin user.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>Tenant Information</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantName">Garage Name *</Label>
                <Input
                  id="tenantName"
                  value={formData.tenantName}
                  onChange={(e) =>
                    setFormData({ ...formData, tenantName: e.target.value })
                  }
                  placeholder="ABC Motors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantSlug">Slug *</Label>
                <Input
                  id="tenantSlug"
                  value={formData.tenantSlug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tenantSlug: e.target.value.toLowerCase(),
                    })
                  }
                  placeholder="abc-motors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription">Subscription Plan *</Label>
              <Select
                value={formData.subscription}
                onValueChange={(value) =>
                  setFormData({ ...formData, subscription: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter - Basic features</SelectItem>
                  <SelectItem value="pro">Pro - Advanced features</SelectItem>
                  <SelectItem value="enterprise">Enterprise - Full access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>Admin User Details</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Name *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) =>
                    setFormData({ ...formData, adminName: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, adminEmail: e.target.value })
                  }
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminPhone">Admin Phone</Label>
                <Input
                  id="adminPhone"
                  type="tel"
                  value={formData.adminPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, adminPhone: e.target.value })
                  }
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Create Tenant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
