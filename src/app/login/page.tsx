"use client";

import { useState } from "react"
import { LoginView } from "@/components/auth-ui/login-view"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
export default function LoginPage() {
  const { signIn } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
      // await signIn(email, password)
      // DO NOTHING ELSE
      // Middleware + server routing will handle redirect
      const user = data.user
    const meta = user?.app_metadata as any

    if (meta?.role === 'platform_admin') {
      router.replace('/admin')
      return
    }

    if (meta?.role === 'mechanic') {
      router.replace('/mechanic')
      return
    }

    if (meta?.tenant_id) {
      router.replace('/tenant')
      return
    }

    router.replace('/auth/no-access')
    if (error) {
        throw error
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false);
    }
  };

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
  );
}
