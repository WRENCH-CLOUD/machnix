'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase, setTenantContext } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  tenantId: string | null
  userRole: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role?: string) => Promise<void>
  signOut: () => Promise<void>
  setActiveTenant: (tenantId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for tenant from cookie (set by middleware for subdomain routing)
    const getTenantFromCookie = () => {
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const tenantCookie = cookies.find(c => c.trim().startsWith('tenant-id='))
        if (tenantCookie) {
          return tenantCookie.split('=')[1]
        }
      }
      return null
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Check for tenant from cookie first (subdomain routing)
      const cookieTenantId = getTenantFromCookie()
      if (cookieTenantId && cookieTenantId !== tenantId) {
        //console.log('[AUTH] Setting tenant from cookie:', cookieTenantId)
        setTenantContext(cookieTenantId)
        setTenantId(cookieTenantId)
      }
      
      if (session?.user) {
        // Check user role on initial load
        checkUserRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (!session) {
        setTenantId(null)
        setUserRole(null)
        localStorage.removeItem('tenantId')
      } else if (session.user) {
        checkUserRole(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // Step 1: Check if user is a platform admin
    if (data.user) {
      //console.log('[AUTH] Checking platform admin for user:', data.user.id)
      const { data: platformAdmin, error: platformAdminError } = await supabase
        .from('platform_admins')
        .select('id, is_active, role')
        .eq('auth_user_id', data.user.id)
        .eq('is_active', true)
        .single()

      //console.log('[AUTH] Platform admin query result:', { platformAdmin, platformAdminError })

      if (!platformAdminError && platformAdmin) {
        //console.log('[AUTH] User is platform admin, setting role to platform_admin')
        setUserRole('platform_admin')
        return
      }

      // Step 2: Check if user exists in tenant.users
      //console.log('[AUTH] Checking tenant.users for user:', data.user.id)
      const { data: userData, error: userError } = await supabase
        .schema('tenant')
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', data.user.id)
        .eq('is_active', true)
        .single()
      
      //console.log('[AUTH] Tenant user query result:', { userData, userError })

      if (!userError && userData) {
        //console.log('[AUTH] User found in tenant.users with role:', userData.role)
        await setActiveTenant(userData.tenant_id)
        setUserRole(userData.role)
        return
      }

      // Step 3: No access found
      //console.log('[AUTH] User has no access')
      setUserRole('no_access')
      throw new Error('You do not have access to this system. Please contact an administrator.')
    }
  }

  const checkUserRole = async (userId: string) => {
    try {
      //console.log('[AUTH] Checking user role for:', userId)
      
      // Step 1: Check if user is a platform admin (may not exist in local dev)
      try {
        const { data: platformAdmin, error: platformAdminError } = await supabase
          .from('platform_admins')
          .select('id, is_active, role')
          .eq('auth_user_id', userId)
          .eq('is_active', true)
          .maybeSingle() // Use maybeSingle to avoid 406 errors

        if (!platformAdminError && platformAdmin) {
          //console.log('[AUTH] User is platform admin')
          setUserRole('platform_admin')
          setLoading(false)
          return
        }
      } catch (err) {
        // Platform admins table might not exist in local dev, continue to tenant check
        //console.log('[AUTH] Platform admins table not accessible, checking tenant users')
      }

      // Step 2: Check if user exists in tenant.users
      const { data: userData, error: userError } = await supabase
        .schema('tenant')
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', userId)
        .eq('is_active', true)
        .single()
      
      if (!userError && userData) {
        //console.log('[AUTH] User found in tenant.users with role:', userData.role)
        await setActiveTenant(userData.tenant_id)
        setUserRole(userData.role)
        setLoading(false)
        return
      }

      // Step 3: No access found
      //console.log('[AUTH] User has no access')
      setUserRole('no_access')
      setLoading(false)
    } catch (error) {
      console.error('[AUTH] Error checking user role:', error)
      setUserRole('no_access')
      setLoading(false)
    }
  }

  const fetchUserRole = async (userId: string, tenantId: string) => {
    const { data } = await supabase
      .schema('tenant')
      .from('users')
      .select('role')
      .eq('auth_user_id', userId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (data) {
      setUserRole(data.role)
    }
  }

  const signUp = async (email: string, password: string, name: string, role: string = 'tenant') => {    // Step 1: Create the auth user
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
      //console.log('User created in auth, now creating tenant and user record...')
      
      try {
        // Use the provided role instead of determining from email
        const userRole = role
        
        let tenantData;
        
        // For tenant role, try to use the Main Garage tenant if it exists
        if (userRole === 'tenant') {
          const { data: existingTenant } = await supabase
            .schema('tenant')
            .from('tenants')
            .select()
            .eq('slug', 'main-garage')
            .single()
          
          if (existingTenant) {
            //console.log('Using existing Main Garage tenant for tenant user')
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
        
        //console.log('Tenant ID:', tenantData.id)
        
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
        
        //console.log('User record created with role:', userRole)
        
        // Set the active tenant
        await setActiveTenant(tenantData.id)
        setUserRole(userRole)
        //console.log('Signup completed successfully')
        
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
    setUserRole(null)
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
        userRole,
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
