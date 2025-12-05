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
    console.log('[AUTH] 🔄 Initializing auth provider...')
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      console.log('[AUTH] 📦 Initial session:', session ? 'Found' : 'None', session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Load saved tenant and role from localStorage
        const savedTenantId = localStorage.getItem('tenantId')
        const savedUserRole = localStorage.getItem('userRole')
        
        console.log('[AUTH] 💾 From localStorage:', { savedTenantId, savedUserRole })
        
        if (savedUserRole) {
          console.log('[AUTH] ✅ Restoring role from localStorage:', savedUserRole)
          setUserRole(savedUserRole)
        }
        
        if (savedTenantId) {
          setTenantContext(savedTenantId)
          setTenantId(savedTenantId)
        }
        
        // Re-fetch user role from database to ensure it's current
        console.log('[AUTH] 🔍 Re-fetching user role from database...')
        await fetchAndSetUserRole(session.user.id, savedTenantId)
      }
      
      console.log('[AUTH] ✅ Auth initialization complete')
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
        setUserRole(null)
        localStorage.removeItem('tenantId')
        localStorage.removeItem('userRole')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('[AUTH] 🔐 SignIn attempt for:', email)
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('[AUTH] ❌ Sign in failed:', error.message)
      throw error
    }
    
    console.log('[AUTH] ✅ Auth successful, user ID:', data.user.id)
    
    // Step 1: Check if user is a platform admin
    if (data.user) {
      console.log('[AUTH] 🔍 Step 1: Checking platform_admins table...')
      console.log('[AUTH] Query: SELECT * FROM public.platform_admins WHERE auth_user_id =', data.user.id)
      
      const { data: platformAdmin, error: platformAdminError } = await supabase
        .from('platform_admins')
        .select('id, is_active, role')
        .eq('auth_user_id', data.user.id)
        .eq('is_active', true)
        .maybeSingle()

      console.log('[AUTH] 📊 Platform admin query result:', { 
        found: !!platformAdmin, 
        platformAdmin, 
        error: platformAdminError?.message,
        errorCode: platformAdminError?.code,
        errorDetails: platformAdminError?.details 
      })

      if (!platformAdminError && platformAdmin) {
        console.log('[AUTH] ✅ User IS a platform admin!')
        console.log('[AUTH] Setting role to platform_admin and storing in localStorage')
        setUserRole('platform_admin')
        localStorage.setItem('userRole', 'platform_admin')
        console.log('[AUTH] ✅ SignIn complete - redirecting to AdminDashboard')
        return
      }

      console.log('[AUTH] ❌ Not a platform admin, checking tenant.users...')
      
      // Step 2: Check if user exists in tenant.users
      console.log('[AUTH] 🔍 Step 2: Checking tenant.users table...')
      console.log('[AUTH] Query: SELECT * FROM tenant.users WHERE auth_user_id =', data.user.id)
      
      const { data: userData, error: userError } = await supabase
        .schema('tenant')
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', data.user.id)
        .eq('is_active', true)
        .maybeSingle()
      
      console.log('[AUTH] 📊 Tenant user query result:', { 
        found: !!userData, 
        userData, 
        error: userError?.message,
        errorCode: userError?.code 
      })

      if (!userError && userData) {
        console.log('[AUTH] ✅ User found in tenant.users!')
        console.log('[AUTH] Role:', userData.role, 'Tenant ID:', userData.tenant_id)
        await setActiveTenant(userData.tenant_id)
        setUserRole(userData.role)
        localStorage.setItem('userRole', userData.role)
        console.log('[AUTH] ✅ SignIn complete - redirecting to', userData.role === 'mechanic' ? 'MechanicDashboard' : 'TenantDashboard')
        return
      }

      // Step 3: No access found
      console.log('[AUTH] ❌ Step 3: User has NO ACCESS')
      console.log('[AUTH] Not in platform_admins and not in tenant.users')
      setUserRole('no_access')
      localStorage.setItem('userRole', 'no_access')
      throw new Error('You do not have access to this system. Please contact an administrator.')
    }
  }

  const fetchUserRole = async (userId: string, tenantId: string) => {
    const { data } = await supabase
      .schema('tenant')
      .from('users')
      .select('role')
      .eq('auth_user_id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    
    if (data) {
      setUserRole(data.role)
      localStorage.setItem('userRole', data.role)
    }
  }

  const fetchAndSetUserRole = async (userId: string, savedTenantId: string | null) => {
    console.log('[AUTH] 🔄 fetchAndSetUserRole called for user:', userId)
    
    // First check if user is a platform admin
    console.log('[AUTH] Checking platform_admins table...')
    const { data: platformAdmin, error: platformAdminError } = await supabase
      .from('platform_admins')
      .select('id, is_active, role')
      .eq('auth_user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    console.log('[AUTH] Platform admin check:', { found: !!platformAdmin, error: platformAdminError?.message })

    if (!platformAdminError && platformAdmin) {
      console.log('[AUTH] ✅ Confirmed platform admin on refresh')
      setUserRole('platform_admin')
      localStorage.setItem('userRole', 'platform_admin')
      return
    }

    // Then check tenant.users
    console.log('[AUTH] Checking tenant.users table...')
    if (savedTenantId) {
      console.log('[AUTH] Using saved tenant ID:', savedTenantId)
      await fetchUserRole(userId, savedTenantId)
    } else {
      console.log('[AUTH] No saved tenant, looking up user tenant...')
      // No saved tenant, try to find user's tenant
      const { data: userData, error: userError } = await supabase
        .schema('tenant')
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', userId)
        .eq('is_active', true)
        .maybeSingle()
      
      console.log('[AUTH] Tenant user lookup:', { found: !!userData, error: userError?.message })
      
      if (!userError && userData) {
        console.log('[AUTH] ✅ Found tenant user, role:', userData.role)
        await setActiveTenant(userData.tenant_id)
        setUserRole(userData.role)
        localStorage.setItem('userRole', userData.role)
      } else {
        console.log('[AUTH] ❌ No tenant user found, setting no_access')
        setUserRole('no_access')
        localStorage.setItem('userRole', 'no_access')
      }
    }
    console.log('[AUTH] ✅ fetchAndSetUserRole complete')
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
      console.log('User created in auth, now creating tenant and user record...')
      
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
            console.log('Using existing Main Garage tenant for tenant user')
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
        setUserRole(userRole)
        localStorage.setItem('userRole', userRole)
        console.log('Signup completed successfully')
        
      } catch (err) {
        console.error('Error in post-signup setup:', err)
        // Note: Cannot clean up auth user with anon key
        // User will exist in auth but won't have tenant access
        // They can sign in but will be redirected to no-access page
        throw new Error('Failed to complete signup. Please contact support if this persists.')
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    setTenantId(null)
    setUserRole(null)
    localStorage.removeItem('tenantId')
    localStorage.removeItem('userRole')
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
