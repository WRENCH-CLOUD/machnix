'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase, setTenantContext } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  tenantId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
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
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
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
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
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

  const signUp = async (email: string, password: string, name: string) => {    // Step 1: Create the auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
    
    if (error) {
      console.error('Supabase signup error:', error)
      throw new Error(`Signup failed: ${error.message}`)
    }
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
      throw new Error('Please check your email to confirm your account before logging in.')
    }
    
    // Step 2: Create tenant and user record manually (trigger is disabled)
    if (data.user && data.session) {
      console.log('User created in auth, now creating tenant and user record...')
      
      try {
        // Determine role based on email
        const adminEmails = ['khanarohithif@gmail.com', 'sagunverma24@gmail.com']
        const userRole = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'frontdesk'
        
        let tenantData;
        
        // For admin emails, try to use the Main Garage tenant if it exists
        if (userRole === 'admin') {
          const { data: existingTenant } = await supabase
            .schema('tenant')
            .from('tenants')
            .select()
            .eq('slug', 'main-garage')
            .single()
          
          if (existingTenant) {
            console.log('Using existing Main Garage tenant for admin')
            tenantData = existingTenant
          }
        }
        
        // If not admin or Main Garage doesn't exist, create a new tenant
        if (!tenantData) {
          const { data: newTenant, error: tenantError } = await supabase
            .schema('tenant')
            .from('tenants')
            .insert({
              name: `Garage - ${name}`,
              slug: `garage-${Date.now()}`,
              metadata: { subscription_status: 'trial' }
            })
            .select()
            .single()
          
          if (tenantError) {
            console.error('Error creating tenant:', tenantError)
            throw new Error(`Failed to create tenant: ${tenantError.message}`)
          }
          
          tenantData = newTenant
        }
        
        console.log('Tenant ID:', tenantData.id)
        
        // Create user record in tenant.users
        const { error: userError } = await supabase
          .schema('tenant')
          .from('users')
          .insert({
            auth_user_id: data.user.id,
            tenant_id: tenantData.id,
            email: email,
            name: name,
            role: userRole
          })
        
        if (userError) {
          console.error('Error creating user record:', userError)
          throw new Error(`Failed to create user record: ${userError.message}`)
        }
        
        console.log('User record created with role:', userRole)
        
        // Set the active tenant
        await setActiveTenant(tenantData.id)
        console.log('Signup completed successfully')
        
      } catch (err) {
        console.error('Error in post-signup setup:', err)
        // Clean up: delete the auth user if tenant/user creation failed
        await supabase.auth.admin.deleteUser(data.user.id).catch(console.error)
        throw err
      }
    }
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
        signUp,
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
