"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type UserRole = "frontdesk" | "mechanic" | "admin"

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  avatar?: string
  tenantId?: string
  tenantName?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo users for testing
const demoUsers: Record<string, User & { password: string }> = {
  "frontdesk@mechanix.com": {
    id: "u1",
    name: "Priya Desai",
    email: "frontdesk@mechanix.com",
    phone: "+91 99887 76543",
    role: "frontdesk",
    avatar: "/professional-indian-woman-portrait.png",
    tenantId: "t1",
    tenantName: "Garage A",
    password: "demo123",
  },
  "mechanic@mechanix.com": {
    id: "u2",
    name: "Ravi Kumar",
    email: "mechanic@mechanix.com",
    phone: "+91 98765 43210",
    role: "mechanic",
    avatar: "/indian-male-mechanic-portrait.jpg",
    tenantId: "t1",
    tenantName: "Garage A",
    password: "demo123",
  },
  "admin@mechanix.com": {
    id: "u3",
    name: "Vikram Admin",
    email: "admin@mechanix.com",
    phone: "+91 88776 65432",
    role: "admin",
    avatar: "/professional-indian-businessman-portrait.png",
    password: "admin123",
  },
  "+91 99887 76543": {
    id: "u1",
    name: "Priya Desai",
    email: "frontdesk@mechanix.com",
    phone: "+91 99887 76543",
    role: "frontdesk",
    avatar: "/professional-indian-woman-portrait.png",
    tenantId: "t1",
    tenantName: "Garage A",
    password: "demo123",
  },
  "+91 98765 43210": {
    id: "u2",
    name: "Ravi Kumar",
    email: "mechanic@mechanix.com",
    phone: "+91 98765 43210",
    role: "mechanic",
    avatar: "/indian-male-mechanic-portrait.jpg",
    tenantId: "t1",
    tenantName: "Garage A",
    password: "demo123",
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (emailOrPhone: string, password: string) => {
    setIsLoading(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const normalizedInput = emailOrPhone.toLowerCase().trim()
    const demoUser = demoUsers[normalizedInput]

    if (demoUser && demoUser.password === password) {
      const { password: _, ...userWithoutPassword } = demoUser
      setUser(userWithoutPassword)
      setIsLoading(false)
      return { success: true }
    }

    setIsLoading(false)
    return { success: false, error: "Invalid credentials. Try demo accounts listed below." }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
