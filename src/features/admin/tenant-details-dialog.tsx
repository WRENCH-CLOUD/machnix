"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

interface TenantDetailsDialogProps {
  tenantId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TenantDetailsDialog({ tenantId, open, onOpenChange }: TenantDetailsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [tenant, setTenant] = useState<any>(null)

  useEffect(() => {
    if (tenantId && open) {
      loadTenantDetails()
    }
  }, [tenantId, open])

  const loadTenantDetails = async () => {
    if (!tenantId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/tenants/${tenantId}`)
      if (!response.ok) throw new Error('Failed to fetch tenant details')
      const data = await response.json()
      setTenant(data.tenant)
    } catch (error) {
      console.error('Failed to load tenant details:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tenant Details</DialogTitle>
          <DialogDescription>
            Detailed information about the tenant
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-8 h-8" />
          </div>
        ) : tenant ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{tenant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Slug</p>
                  <p className="font-medium">{tenant.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{tenant.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subscription</p>
                  <p className="font-medium capitalize">{tenant.subscription}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No tenant data available</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
