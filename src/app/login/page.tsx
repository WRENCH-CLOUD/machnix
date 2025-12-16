"use client"

import { useState } from "react"
import { LoginView } from "@/app/(auth)/components/login-view"
import { useAuth } from "@/providers/auth-provider"

export default function LoginPage() {
  const { signIn } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await signIn(email, password)
      // DO NOTHING ELSE
      // Middleware + server routing will handle redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LoginView
      email={email}
      password={password}
      error={error}
      isLoading={isLoading}
      showPassword={showPassword}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onTogglePassword={() => setShowPassword(!showPassword)}
      onSubmit={handleSubmit}
    />
  )
}
