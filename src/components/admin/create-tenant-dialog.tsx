"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Mail, User, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateTenantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface CreateTenantFormData {
  tenantName: string
  tenantSlug: string
  adminName: string
  adminEmail: string
  adminPhone?: string
  subscription: "starter" | "pro" | "enterprise"
  notes?: string
}

export function CreateTenantDialog({ open, onOpenChange, onSuccess }: CreateTenantDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateTenantFormData>({
    defaultValues: {
      subscription: "pro",
    },
  })

  const tenantName = watch("tenantName")

  // Auto-generate slug from tenant name
  const handleTenantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
    setValue("tenantSlug", slug)
  }

  const onSubmit = async (data: CreateTenantFormData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/admin/tenants/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create tenant")
      }

      setSuccess(true)
      setInviteLink(result.inviteLink)
      
      // Don't auto-close - let user manually close after copying the link
      // setTimeout(() => {
      //   reset()
      //   setSuccess(false)
      //   setInviteLink(null)
      //   onOpenChange(false)
      //   onSuccess?.()
      // }, 5000)
    } catch (err) {
      console.error("Failed to create tenant:", err)
      setError(err instanceof Error ? err.message : "Failed to create tenant")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading && !success) {
      reset()
      setError(null)
      setSuccess(false)
      setInviteLink(null)
      onOpenChange(false)
    }
  }

  const handleSuccessClose = () => {
    reset()
    setError(null)
    setSuccess(false)
    setInviteLink(null)
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create New Tenant
          </DialogTitle>
          <DialogDescription>
            Create a new tenant organization with admin user. An invitation email will be sent automatically.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 space-y-4">
            <Alert className="border-emerald-500/50 bg-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <AlertDescription className="text-emerald-500">
                Tenant created successfully! An invitation email has been sent to the admin.
              </AlertDescription>
            </Alert>
            {inviteLink && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                <Label className="text-base font-semibold">Magic Link (Copy and send to admin)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  This link is valid for 24 hours and allows the admin to set up their account.
                </p>
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink)
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSuccessClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Tenant Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="w-4 h-4" />
                <span>Tenant Information</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantName">
                    Tenant Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tenantName"
                    placeholder="e.g., Speedy Auto Service"
                    {...register("tenantName", {
                      required: "Tenant name is required",
                      minLength: { value: 3, message: "Minimum 3 characters" },
                    })}
                    onChange={(e) => {
                      register("tenantName").onChange(e)
                      handleTenantNameChange(e)
                    }}
                  />
                  {errors.tenantName && (
                    <p className="text-xs text-destructive">{errors.tenantName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantSlug">
                    Tenant Slug <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tenantSlug"
                    placeholder="speedy-auto-service"
                    {...register("tenantSlug", {
                      required: "Tenant slug is required",
                      pattern: {
                        value: /^[a-z0-9-]+$/,
                        message: "Only lowercase letters, numbers, and hyphens",
                      },
                    })}
                  />
                  {errors.tenantSlug && (
                    <p className="text-xs text-destructive">{errors.tenantSlug.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription">Subscription Plan</Label>
                <Select
                  defaultValue="pro"
                  onValueChange={(value) =>
                    setValue("subscription", value as "starter" | "pro" | "enterprise")
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

            {/* Admin User Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4" />
                <span>Admin User Details</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminName">
                  Admin Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="adminName"
                  placeholder="Full name"
                  {...register("adminName", {
                    required: "Admin name is required",
                  })}
                />
                {errors.adminName && (
                  <p className="text-xs text-destructive">{errors.adminName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">
                    Admin Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@example.com"
                      className="pl-10"
                      {...register("adminEmail", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                    />
                  </div>
                  {errors.adminEmail && (
                    <p className="text-xs text-destructive">{errors.adminEmail.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPhone">Admin Phone (Optional)</Label>
                  <Input
                    id="adminPhone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    {...register("adminPhone")}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional information about this tenant..."
                rows={3}
                {...register("notes")}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Tenant & Send Invite"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
