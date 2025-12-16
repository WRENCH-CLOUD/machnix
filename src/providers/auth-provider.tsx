'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, setTenantContext } from '@/lib/supabase/client'
import { set } from 'date-fns'

interface AuthContextType {
  user: User | null
  session: Session | null
  tenantId: string | null
  userRole: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Extract authoritative claims from JWT (app_metadata)
 */
function extractClaims(session: Session | null) {
  if (!session?.user) return null

  const meta = session.user.app_metadata as any

  return {
    role: meta.role ?? null,
    tenantId: meta.tenant_id ?? null,
    userType: meta.user_type ?? null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Initial session load
   */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Apply session + JWT claims consistently
   */
  const applySession = (session: Session | null) => {
    setSession(session)
    setUser(session?.user ?? null)

    const claims = extractClaims(session)

    if (!claims) {
      setTenantId(null)
      setUserRole(null)
      console.log('[AuthProvider] No claims found in session')
      return
    }

    console.log('[AuthProvider] Claims extracted:', {
      role: claims.role,
      tenantId: claims.tenantId,
      userType: claims.userType,
      userId: session?.user?.id
    })
    setUserRole(claims.role)
    setTenantId(claims.tenantId)

    if (claims.tenantId) {
      // This sets Postgres RLS session context
      setTenantContext(claims.tenantId)
    }
  }

  /**
   * Sign in (JWT claims already exist — we just read them)
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

  }

  /**
   * Sign out
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    setUser(null)
    setSession(null)
    setTenantId(null)
    setUserRole(null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      const claims = extractClaims(session)
      if (claims) {
        setTenantId(claims?.tenantId ?? null)
        setUserRole(claims?.role ?? null)
        if (claims?.tenantId) {
          // This sets Postgres RLS session context
          setTenantContext(claims.tenantId)
        }
      }
      setLoading(false)
      console.log("AuthProvider session changed:", session)
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        tenantId,
        userRole,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
