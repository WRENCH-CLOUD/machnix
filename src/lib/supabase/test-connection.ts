import { supabase, getSafeSession } from './client'

export interface ConnectionTestResult {
  success: boolean
  message: string
  details?: {
    url?: string
    authConfigured: boolean
    canConnect: boolean
    error?: string
  }
}

/**
 * Test Supabase connection and configuration
 * This function checks:
 * 1. Environment variables are set
 * 2. Can connect to Supabase
 * 3. Can authenticate
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check environment variables
  if (!url || !key) {
    return {
      success: false,
      message: '❌ Missing Supabase environment variables',
      details: {
        url: url || 'NOT SET',
        authConfigured: false,
        canConnect: false,
        error: 'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
      },
    }
  }

  // Check if URL is still placeholder
  if (url.includes('your-project')) {
    return {
      success: false,
      message: '⚠️  Supabase URL is still placeholder',
      details: {
        url,
        authConfigured: false,
        canConnect: false,
        error: 'Please replace placeholder URL with your actual Supabase project URL',
      },
    }
  }

  try {
    // Test 1: Check if we can query the tenant schema
    const { error: queryError } = await supabase
      .schema('tenant')
      .from('tenants')
      .select('id')
      .limit(1)

    // PGRST116 = table doesn't exist, which is OK (means connection works)
    // No error or PGRST116 = connection successful
    if (!queryError || queryError.code === 'PGRST116') {
      return {
        success: true,
        message: '✅ Supabase connected successfully!',
        details: {
          url,
          authConfigured: true,
          canConnect: true,
        },
      }
    }

    // Other errors mean connection issue
    return {
      success: false,
      message: '❌ Failed to connect to Supabase',
      details: {
        url,
        authConfigured: true,
        canConnect: false,
        error: `${queryError.message} (Code: ${queryError.code})`,
      },
    }
  } catch (err) {
    return {
      success: false,
      message: '❌ Connection test failed',
      details: {
        url,
        authConfigured: true,
        canConnect: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
    }
  }
}

/**
 * Test authentication system
 */
export async function testSupabaseAuth(): Promise<ConnectionTestResult> {
  try {
    // Get current session
    const { session, error, recovered } = await getSafeSession()

    if (recovered) {
      return {
        success: false,
        message: '⚠️ Auth session was invalid and has been cleared',
        details: {
          authConfigured: false,
          canConnect: true,
          error: 'Refresh token missing/invalid; session cleared safely',
        },
      }
    }

    if (error) {
      return {
        success: false,
        message: '❌ Auth system error',
        details: {
          authConfigured: false,
          canConnect: true,
          error: error.message,
        },
      }
    }

    if (session) {
      return {
        success: true,
        message: '✅ User is authenticated',
        details: {
          authConfigured: true,
          canConnect: true,
        },
      }
    }

    return {
      success: true,
      message: '✅ Auth system working (no active session)',
      details: {
        authConfigured: true,
        canConnect: true,
      },
    }
  } catch (err) {
    return {
      success: false,
      message: '❌ Auth test failed',
      details: {
        authConfigured: false,
        canConnect: true,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
    }
  }
}

/**
 * Run all tests and log results to console
 */
export async function runAllTests() {
  //console.log('🔍 Testing Supabase Configuration...\n')

  // Test 1: Connection
  const connectionResult = await testSupabaseConnection()
  //console.log(connectionResult.message)
  if (connectionResult.details) {
    //console.log('  URL:', connectionResult.details.url)
    if (connectionResult.details.error) {
      //console.log('  Error:', connectionResult.details.error)
    }
  }
  //console.log('')

  if (!connectionResult.success) {
    return connectionResult
  }

  // Test 2: Auth
  const authResult = await testSupabaseAuth()
  //console.log(authResult.message)
  if (authResult.details?.error) {
    //console.log('  Error:', authResult.details.error)
  }
  //console.log('')

  return {
    connection: connectionResult,
    auth: authResult,
  }
}
