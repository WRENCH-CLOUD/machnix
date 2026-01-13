"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Settings</CardTitle>
        <CardDescription>Platform configuration and settings</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Admin settings interface coming soon...</p>
      </CardContent>
    </Card>
  )
}
