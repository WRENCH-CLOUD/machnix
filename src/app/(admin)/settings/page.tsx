"use client"

import { ResetPasswordForm } from "@/components/auth-ui/ResetPasswordForm"

export default function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
      </div>
      <ResetPasswordForm />
    </div>
  )
}
