"use client"

import React, { useState, FormEvent } from "react"
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PasswordField {
  value: string
  visible: boolean
}

interface ValidationErrors {
  existingPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export function ChangePasswordForm() {
  // Form state
  const [existingPassword, setExistingPassword] = useState<PasswordField>({
    value: "",
    visible: false,
  })
  const [newPassword, setNewPassword] = useState<PasswordField>({
    value: "",
    visible: false,
  })
  const [confirmPassword, setConfirmPassword] = useState<PasswordField>({
    value: "",
    visible: false,
  })

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>("")
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Toggle password visibility
  const togglePasswordVisibility = (field: "existing" | "new" | "confirm") => {
    switch (field) {
      case "existing":
        setExistingPassword((prev) => ({ ...prev, visible: !prev.visible }))
        break
      case "new":
        setNewPassword((prev) => ({ ...prev, visible: !prev.visible }))
        break
      case "confirm":
        setConfirmPassword((prev) => ({ ...prev, visible: !prev.visible }))
        break
    }
  }

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}

    if (!existingPassword.value) {
      errors.existingPassword = "Existing password is required"
    }

    if (!newPassword.value) {
      errors.newPassword = "New password is required"
    }

    if (!confirmPassword.value) {
      errors.confirmPassword = "Please confirm your new password"
    } else if (newPassword.value && confirmPassword.value !== newPassword.value) {
      errors.confirmPassword = "Passwords do not match"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle field blur for inline validation
  const handleBlur = (field: keyof ValidationErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateForm()
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({
      existingPassword: true,
      newPassword: true,
      confirmPassword: true,
    })

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setSubmitError("")
    setSubmitSuccess(false)

    try {
      // Call the change-password API endpoint
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: existingPassword.value,
          newPassword: newPassword.value,
          confirmNewPassword: confirmPassword.value,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error codes from the API
        const errorMessage = data.error?.message || 'Failed to change password. Please try again.'
        throw new Error(errorMessage)
      }

      // Success - reset form
      setSubmitSuccess(true)
      setExistingPassword({ value: "", visible: false })
      setNewPassword({ value: "", visible: false })
      setConfirmPassword({ value: "", visible: false })
      setTouched({})
      setValidationErrors({})

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to change password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Check if form is valid for submit button state
  const isFormValid =
    existingPassword.value !== "" && newPassword.value !== "" && confirmPassword.value !== "" && Object.keys(validationErrors).length === 0

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Change your password by verifying your existing password first</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Existing Password Field */}
          <div className="space-y-2">
            <Label htmlFor="existing-password">
              Existing Password<span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="existing-password"
                type={existingPassword.visible ? "text" : "password"}
                placeholder="Enter your current password"
                value={existingPassword.value}
                onChange={(e) => setExistingPassword((prev) => ({ ...prev, value: e.target.value }))}
                onBlur={() => handleBlur("existingPassword")}
                className="pl-10 pr-10"
                required
                autoComplete="current-password"
                aria-invalid={touched.existingPassword && !!validationErrors.existingPassword}
                aria-describedby={touched.existingPassword && validationErrors.existingPassword ? "existing-password-error" : undefined}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("existing")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-md p-1"
                aria-label={existingPassword.visible ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {existingPassword.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {touched.existingPassword && validationErrors.existingPassword && (
              <p id="existing-password-error" className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {validationErrors.existingPassword}
              </p>
            )}
          </div>

          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="new-password">
              New Password<span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={newPassword.visible ? "text" : "password"}
                placeholder="Enter your new password"
                value={newPassword.value}
                onChange={(e) => {
                  const value = e.target.value
                  setNewPassword((prev) => ({ ...prev, value }))
                  if (confirmPassword.value && touched.confirmPassword) {
                    validateForm()
                  }
                }}
                onBlur={() => handleBlur("newPassword")}
                className="pl-10 pr-10"
                required
                autoComplete="new-password"
                aria-invalid={touched.newPassword && !!validationErrors.newPassword}
                aria-describedby={touched.newPassword && validationErrors.newPassword ? "new-password-error" : undefined}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-md p-1"
                aria-label={newPassword.visible ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {newPassword.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {touched.newPassword && validationErrors.newPassword && (
              <p id="new-password-error" className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {validationErrors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              Confirm New Password<span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={confirmPassword.visible ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword.value}
                onChange={(e) => setConfirmPassword((prev) => ({ ...prev, value: e.target.value }))}
                onBlur={() => handleBlur("confirmPassword")}
                className="pl-10 pr-10"
                required
                autoComplete="new-password"
                aria-invalid={touched.confirmPassword && !!validationErrors.confirmPassword}
                aria-describedby={touched.confirmPassword && validationErrors.confirmPassword ? "confirm-password-error" : undefined}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-md p-1"
                aria-label={confirmPassword.visible ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {confirmPassword.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {touched.confirmPassword && validationErrors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Password changed successfully!</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={!isFormValid || isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Spinner className="text-primary-foreground" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Reset Password
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => {
                setExistingPassword({ value: "", visible: false })
                setNewPassword({ value: "", visible: false })
                setConfirmPassword({ value: "", visible: false })
                setTouched({})
                setValidationErrors({})
                setSubmitError("")
                setSubmitSuccess(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
