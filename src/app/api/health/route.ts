import { NextResponse } from 'next/server'
import { getEnvStatus } from '@/lib/env'
import { createClient } from '@supabase/supabase-js'

/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Returns the health status of the application including:
 * - Environment configuration status
 * - Database connectivity
 * - Overall system health
 *
 * Response codes:
 * - 200: Healthy - all checks pass
 * - 503: Unhealthy - one or more checks failed
 *
 * This endpoint is designed for:
 * - Kubernetes liveness/readiness probes
 * - Load balancer health checks
 * - Monitoring systems
 */

interface HealthCheckResult {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  message?: string
  latencyMs?: number
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: HealthCheckResult[]
}

// Track server start time for uptime calculation
const startTime = Date.now()

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now()

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: 'Database configuration missing',
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // Simple query to test connectivity
    const { error } = await supabase.from('tenants').select('id').limit(1)

    const latencyMs = Date.now() - start

    if (error) {
      // PostgREST error PGRST301: JWT missing/malformed - expected with anonymous client
      // This indicates the database connection is working, RLS is active
      if (error.code === 'PGRST301') {
        return {
          name: 'database',
          status: 'healthy',
          message: 'Connected (RLS active)',
          latencyMs,
        }
      }

      // PostgreSQL error 42501: Insufficient privilege
      // Mark as degraded rather than healthy to surface potential permission issues
      // while still indicating database connectivity is working
      if (error.code === '42501') {
        return {
          name: 'database',
          status: 'degraded',
          message: 'Connected but insufficient privileges - check database permissions',
          latencyMs,
        }
      }

      return {
        name: 'database',
        status: 'unhealthy',
        message: `Database error: ${error.message}`,
        latencyMs,
      }
    }

    return {
      name: 'database',
      status: 'healthy',
      message: 'Connected',
      latencyMs,
    }
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      latencyMs: Date.now() - start,
    }
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment(): HealthCheckResult {
  const envStatus = getEnvStatus()

  if (!envStatus.valid) {
    return {
      name: 'environment',
      status: 'unhealthy',
      message: `Missing required: ${envStatus.missingRequired.join(', ')}`,
    }
  }

  if (envStatus.missingOptional.length > 0) {
    return {
      name: 'environment',
      status: 'degraded',
      message: `Optional missing: ${envStatus.missingOptional.slice(0, 3).join(', ')}${envStatus.missingOptional.length > 3 ? '...' : ''}`,
    }
  }

  return {
    name: 'environment',
    status: 'healthy',
    message: 'All variables configured',
  }
}

/**
 * GET /api/health
 *
 * Main health check endpoint
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const verbose = url.searchParams.get('verbose') === 'true'

  // Run all health checks
  const checks: HealthCheckResult[] = [
    checkEnvironment(),
    await checkDatabase(),
  ]

  // Determine overall status
  const hasUnhealthy = checks.some((c) => c.status === 'unhealthy')
  const hasDegraded = checks.some((c) => c.status === 'degraded')

  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
  if (hasUnhealthy) {
    overallStatus = 'unhealthy'
  } else if (hasDegraded) {
    overallStatus = 'degraded'
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    environment: process.env.NODE_ENV ?? 'unknown',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: verbose ? checks : checks.map(({ name, status }) => ({ name, status })),
  }

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 503

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

/**
 * HEAD /api/health
 *
 * Lightweight health check - just returns status code
 */
export async function HEAD() {
  const envStatus = getEnvStatus()
  const statusCode = envStatus.valid ? 200 : 503

  return new NextResponse(null, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
