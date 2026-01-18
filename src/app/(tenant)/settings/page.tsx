"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useAuth } from "@/providers/auth-provider"
import { Building2, Phone, Mail, MapPin, Clock, Save, Loader2 } from "lucide-react"
import { ChangePasswordForm } from "@/components/auth-ui/ResetPasswordForm"
import { useTenantSettings, useInvalidateQueries } from "@/hooks/queries"
import { api } from "@/lib/supabase/client"

// Helper type to handle form state where DB fields might be null but form inputs need defined values (e.g. empty strings)
type GarageProfile = {
  name: string
  businessHours: string
  gstNumber: string
  address: string
  city: string
  state: string
  pincode: string
  businessPhone: string
  businessEmail: string
}

export default function TenantSettingsPage() {
  const { tenantId } = useAuth()
  const { invalidateTenantSettings } = useInvalidateQueries()
  const [saving, setSaving] = useState(false)
  
  // Use React Query for fetching tenant settings
  const { data: tenantSettings, isLoading } = useTenantSettings()
  
  // Initialize with empty strings to avoid uncontrolled inputs
  const [profile, setProfile] = useState<GarageProfile>({
    name: "",
    gstNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    businessPhone: "",
    businessEmail: "",
    businessHours: "" // Note: Not in DB schema yet, handled as local state mostly for now
  })

  // Sync profile state when tenantSettings loads
  useEffect(() => {
    if (tenantSettings) {
      setProfile(prev => ({
        ...prev,
        name: tenantSettings.legalName || "",
        gstNumber: tenantSettings.gstNumber || "",
        address: tenantSettings.address || "",
        city: tenantSettings.city || "",
        state: tenantSettings.state || "",
        pincode: tenantSettings.pincode || "",
        businessPhone: tenantSettings.businessPhone || "",
        businessEmail: tenantSettings.businessEmail || "",
      }))
    }
  }, [tenantSettings])

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await api.put('/api/tenant/settings', profile)

      if (!res.ok) throw new Error('Failed to update')

      await invalidateTenantSettings()
      toast.success("Your garage settings have been updated.")
    } catch (err) {
      toast.error("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your garage profile and preferences
        </p>
      </div>

      <Separator />

      {/* Garage Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Garage Profile
          </CardTitle>
          <CardDescription>
            Basic information about your garage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={profile.gstNumber}
                onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })}
                placeholder="e.g., 29ABCDE1234F1Z5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address (Garage Address)
            </Label>
            <Input
              id="address"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Enter garage address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                placeholder="City"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                placeholder="State"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={profile.pincode}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                placeholder="Pincode"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                value={profile.businessPhone}
                onChange={(e) => setProfile({ ...profile, businessPhone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.businessEmail}
                onChange={(e) => setProfile({ ...profile, businessEmail: e.target.value })}
                placeholder="garage@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Hours
          </CardTitle>
          <CardDescription>
            Set your garage operating hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="businessHours">Operating Hours</Label>
            <Input
              id="businessHours"
              value={profile.businessHours}
              onChange={(e) => setProfile({ ...profile, businessHours: e.target.value })}
              placeholder="e.g., 9:00 AM - 6:00 PM"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Business hours configuration coming soon.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-6 bg-background/80 backdrop-blur rounded-lg p-2 border">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="space-y-6">
             {/* Change Password Section */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Account Security</h2>
              <p className="text-muted-foreground mb-4">
                Update your password to keep your account secure
              </p>
              <ChangePasswordForm />
            </div>
        </div>
      </div>
    </div>
  )
}
