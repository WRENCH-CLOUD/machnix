"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/providers/auth-provider"
import { Building2, Phone, Mail, MapPin, Clock, Save, Loader2 } from "lucide-react"

interface TenantProfile {
  name: string
  address: string
  phone: string
  email: string
  gstNumber: string
  businessHours: string
}

export default function TenantSettingsPage() {
  const { tenantId } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<TenantProfile>({
    name: "",
    address: "",
    phone: "",
    email: "",
    gstNumber: "",
    businessHours: "9:00 AM - 6:00 PM"
  })

  useEffect(() => {
    if (tenantId) {
      fetchTenantProfile()
    }
  }, [tenantId])

  const fetchTenantProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tenant/stats')
      if (res.ok) {
        const data = await res.json()
        setProfile(prev => ({
          ...prev,
          name: data.name || prev.name,
          // Other fields will be populated when we add them to the API
        }))
      }
    } catch (err) {
      console.error('Failed to fetch tenant profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // TODO: Implement tenant profile update API
      toast({
        title: "Settings saved",
        description: "Your garage settings have been updated.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
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
              <Label htmlFor="name">Garage Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter garage name"
              />
            </div>
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
              Address
            </Label>
            <Input
              id="address"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Enter garage address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
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
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
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
            />
            <p className="text-xs text-muted-foreground">
              This will be displayed on your invoices and estimates
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">More Settings Coming Soon</CardTitle>
          <CardDescription>
            Additional settings for invoices, notifications, and tax configuration will be available in future updates.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
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
    </div>
  )
}
