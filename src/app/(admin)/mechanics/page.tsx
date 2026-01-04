"use client"

import { HardHat, Activity, Wrench } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect, useMemo } from "react"

import { type TenantWithStats } from "@/modules/tenant"

export default function MechanicsView() {
    const [tenants, setTenants] = useState<TenantWithStats[]>([])


  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants')
      if (!response.ok) {
        throw new Error('Failed to fetch tenants')
      }
      const { tenants: data } = await response.json()
      setTenants(data)
    } catch (err) {
      console.error('Failed to load tenants:', err)
    }
  }

  const totalMechanics = useMemo(() => {
    return tenants.reduce((sum, t) => sum + (t.mechanic_count || 0), 0)
  }, [tenants])

  return (
    <>
      {/* Mechanic Stats Header */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <HardHat className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalMechanics}</div>
                <div className="text-sm text-muted-foreground">Total Mechanics</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">-</div>
                <div className="text-sm text-muted-foreground">Avg. Utilization</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">-</div>
                <div className="text-sm text-muted-foreground">Avg. Job Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mechanic Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Global Mechanic Activity</CardTitle>
          <CardDescription>Performance metrics across all garages (Coming Soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <HardHat className="w-12 h-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Mechanic activity tracking will be implemented with real-time data
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
