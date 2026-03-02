/**
 * Change Password API Route
 * 
 * POST /api/auth/change-password
 * 
 * Allows authenticated users to change their password after verifying
 * their current password.
 * 
 * Security features:
 * - Rate limited to prevent brute force attacks
 * - Requires valid session (authenticated user only)
 * - Verifies current password before change
 * - Returns generic error messages to prevent information leakage
 * - Audit logging for security events
 * 
 * @module api/auth/change-password
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ChangePasswordUseCase,
  type ChangePasswordInput,
  type ChangePasswordErrorCode,
} from '@/modules/access/application/change-password.usecase'
import { SupabaseAuthRepository } from '@/modules/access/infrastructure/auth.repository.supabase'
import {
  checkUserRateLimit,
  createRateLimitResponse,
  type RateLimitConfig,
} from '@/lib/rate-limiter'

// ============================================================================
// RATE LIMIT CONFIGURATION
// ============================================================================

/**
 * Strict rate limit for password change attempts
 * 5 attempts per 15 minutes to prevent brute force attacks
 */
const CHANGE_PASSWORD_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
}

// ============================================================================
// HTTP STATUS CODE MAPPING
// ============================================================================

/**
 * Map error codes to appropriate HTTP status codes
 * - 400: Validation errors (client error)
 * - 401: Authentication errors (current password invalid)
 * - 500: Server errors
 */
function getHttpStatus(errorCode: ChangePasswordErrorCode): number {
  switch (errorCode) {
    case 'VALIDATION_ERROR':
    case 'PASSWORD_REQUIREMENTS_NOT_MET':
      return 400 // Bad Request
    case 'CURRENT_PASSWORD_INVALID':
      // Return 401 for auth failures, but message is generic
      return 401 // Unauthorized
    case 'PASSWORD_UPDATE_FAILED':
    case 'INTERNAL_ERROR':
    default:
      return 500 // Internal Server Error
  }
}

// ============================================================================
// REQUEST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Step 1: Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      // Log without sensitive data
      console.warn('[CHANGE_PASSWORD_API] Unauthorized access attempt:', {
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Step 2: Apply rate limiting (user-scoped)
    const rateLimitResult = checkUserRateLimit(
      user.id,
      CHANGE_PASSWORD_RATE_LIMIT,
      'change-password'
    )

    if (!rateLimitResult.success) {
      console.warn('[CHANGE_PASSWORD_API] Rate limit exceeded:', {
        userId: user.id,
        timestamp: new Date().toISOString(),
      })

      return createRateLimitResponse(rateLimitResult)
    }

    // Step 3: Parse and validate request body
    let body: ChangePasswordInput
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        },
        { status: 400 }
      )
    }

    // Ensure required fields exist (defensive check)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request body must be a JSON object',
          },
        },
        { status: 400 }
      )
    }

    // Step 4: Execute use case with repository injection
    const authRepository = new SupabaseAuthRepository()
    const changePasswordUseCase = new ChangePasswordUseCase(authRepository)
    
    const result = await changePasswordUseCase.execute(
      { userId: user.id, email: user.email! },
      {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
        confirmNewPassword: body.confirmNewPassword,
      }
    )

    // Step 5: Return response
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: 'Password changed successfully',
        },
        {
          status: 200,
          headers: {
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          },
        }
      )
    }

    // Return error with appropriate status code
    return NextResponse.json(
      {
        success: false,
        error: result.error,
      },
      {
        status: getHttpStatus(result.error!.code),
      }
    )

  } catch (error) {
    // Catch-all for unexpected errors
    console.error('[CHANGE_PASSWORD_API] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// METHOD NOT ALLOWED
// ============================================================================

/**
 * Only POST is allowed for password changes
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
      },
    },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
      },
    },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
      },
    },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
      },
    },
    { status: 405 }
  )
}
