import { NextResponse } from 'next/server'
import { getEnvStatus } from '@/lib/env'

/**
 * Readiness Check Endpoint
 *
 * GET /api/ready
 *
 * A lightweight endpoint to check if the application is ready to serve traffic.
 * Unlike /api/health which performs deep checks, this endpoint is designed
 * to be fast and is suitable for frequent polling by load balancers.
 *
 * Response codes:
 * - 200: Ready to serve traffic
 * - 503: Not ready (configuration issues)
 *
 * This endpoint only checks:
 * - Required environment variables are present
 *
 * Use cases:
 * - Kubernetes readiness probe
 * - Load balancer health checks
 * - Quick startup verification
 */

interface ReadinessResponse {
  ready: boolean
  timestamp: string
}

/**
 * GET /api/ready
 */
export async function GET() {
  const envStatus = getEnvStatus()

  const response: ReadinessResponse = {
    ready: envStatus.valid,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response, {
    status: envStatus.valid ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

/**
 * HEAD /api/ready
 *
 * Even more lightweight - just returns status code
 */
export async function HEAD() {
  const envStatus = getEnvStatus()

  return new NextResponse(null, {
    status: envStatus.valid ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
