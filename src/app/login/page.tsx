"use client";

import { useState, type FormEvent } from "react"
import { LoginView } from "@/components/auth-ui/login-view"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
export default function LoginPage() {
  const { signIn } = useAuth()

  const router = useRouter()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    console.log("HANDLE SUBMIT HIT!@!!!!");

    setError("");
    setIsLoading(true);

    try {
      console.log("LOGIN SUBMIT" , { email, password });

      await signIn(email, password);

      
      
      router.replace("/auth/resolve");
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
