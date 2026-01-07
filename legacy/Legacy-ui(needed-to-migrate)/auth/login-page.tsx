"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Wrench, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, User, Shield, HardHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/providers/auth-provider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"tenant" | "mechanic">("tenant")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Name is required")
          return
        }
        await signUp(email, password, name, role)
      } else {
        const identifier = loginMethod === "email" ? email : phone
        await signIn(identifier, password)
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/abstract-geometric-pattern-automotive.jpg')] opacity-5" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                <Wrench className="w-8 h-8 text-primary-foreground" />
              </div>
              <span className="text-4xl font-bold text-foreground">machnix</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Garage Management,
              <br />
              <span className="text-primary">Simplified.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Streamline your auto repair business with digital inspections, job tracking, and seamless customer
              communication.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 grid grid-cols-3 gap-6"
          >
            {[
              { value: "500+", label: "Garages" },
              { value: "50K+", label: "Jobs/Month" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Wrench className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">machnix</span>
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{mode === "signin" ? "Welcome Back" : "Create Account"}</CardTitle>
              <CardDescription>
                {mode === "signin" ? "Sign in to your account to continue" : "Get started with your garage management"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mode === "signup" && (
                <div className="space-y-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Select Role</Label>
                    <RadioGroup value={role} onValueChange={(value) => setRole(value as "tenant" | "mechanic")}>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors" onClick={() => setRole("tenant")}>
                          <RadioGroupItem value="tenant" id="role-tenant" />
                          <Label htmlFor="role-tenant" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Shield className="w-4 h-4 text-primary" />
                            <div>
                              <div className="font-medium">Garage Owner</div>
                              <div className="text-xs text-muted-foreground">Full garage access</div>
                            </div>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors" onClick={() => setRole("mechanic")}>
                          <RadioGroupItem value="mechanic" id="role-mechanic" />
                          <Label htmlFor="role-mechanic" className="flex items-center gap-2 cursor-pointer flex-1">
                            <HardHat className="w-4 h-4 text-primary" />
                            <div>
                              <div className="font-medium">Mechanic</div>
                              <div className="text-xs text-muted-foreground">Work on assigned jobs</div>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as "email" | "phone")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="gap-2" disabled={mode === "signup"}>
                    <Phone className="w-4 h-4" />
                    Phone
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <TabsContent value="email" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="phone" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 99999 99999"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <Button type="submit" className="w-full gap-2" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        {mode === "signin" ? "Signing in..." : "Creating account..."}
                      </>
                    ) : (
                      <>
                        {mode === "signin" ? "Sign In" : "Sign Up"}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                  </div>
                </form>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
