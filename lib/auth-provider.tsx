'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, setTenantContext } from './supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  tenantId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setActiveTenant: (tenantId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Load tenant from localStorage if available
      const savedTenantId = localStorage.getItem('tenantId')
      if (savedTenantId && session) {
        setTenantContext(savedTenantId)
        setTenantId(savedTenantId)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (!session) {
        setTenantId(null)
        localStorage.removeItem('tenantId')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    setTenantId(null)
    localStorage.removeItem('tenantId')
  }

  const setActiveTenant = async (newTenantId: string) => {
    await setTenantContext(newTenantId)
    setTenantId(newTenantId)
    localStorage.setItem('tenantId', newTenantId)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        tenantId,
        loading,
        signIn,
        signOut,
        setActiveTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
