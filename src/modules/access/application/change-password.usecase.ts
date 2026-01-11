/**
 * Change Password Use Case
 * 
 * Handles secure password changes for authenticated users.
 * 
 * Security considerations:
 * - Verifies current password before allowing change
 * - Validates new password meets security requirements
 * - Never logs raw passwords
 * - Returns generic error messages to prevent information leakage
 * - Invalidates sessions after password change (handled by auth provider)
 * 
 * @module access/application/change-password.usecase
 */

import type { AuthRepository } from '../infrastructure/auth.repository'

// ============================================================================
// TYPES
// ============================================================================

export interface ChangePasswordInput {
  /** The user's current password for verification */
  currentPassword: string
  /** The new password to set */
  newPassword: string
  /** Confirmation of the new password (must match newPassword) */
  confirmNewPassword: string
}

/** User context required for password change */
export interface ChangePasswordUserContext {
  /** The authenticated user's ID */
  userId: string
  /** The authenticated user's email */
  email: string
}

export interface ChangePasswordResult {
  success: boolean
  error?: {
    code: ChangePasswordErrorCode
    message: string
  }
}

export type ChangePasswordErrorCode =
  | 'VALIDATION_ERROR'
  | 'CURRENT_PASSWORD_INVALID'
  | 'PASSWORD_REQUIREMENTS_NOT_MET'
  | 'PASSWORD_UPDATE_FAILED'
  | 'INTERNAL_ERROR'

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum password length requirement */
const MIN_PASSWORD_LENGTH = 8

/** Maximum password length to prevent DoS attacks */
const MAX_PASSWORD_LENGTH = 128

// ============================================================================
// VALIDATION
// ============================================================================

interface ValidationResult {
  isValid: boolean
  errorCode?: ChangePasswordErrorCode
  errorMessage?: string
}

/**
 * Validates the password change input without logging sensitive data
 */
function validateInput(input: ChangePasswordInput): ValidationResult {
  const { currentPassword, newPassword, confirmNewPassword } = input

  // Check all fields are present and non-empty
  if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim().length === 0) {
    return {
      isValid: false,
      errorCode: 'VALIDATION_ERROR',
      errorMessage: 'Current password is required',
    }
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
    return {
      isValid: false,
      errorCode: 'VALIDATION_ERROR',
      errorMessage: 'New password is required',
    }
  }

  if (!confirmNewPassword || typeof confirmNewPassword !== 'string') {
    return {
      isValid: false,
      errorCode: 'VALIDATION_ERROR',
      errorMessage: 'Password confirmation is required',
    }
  }

  // Check password confirmation matches
  if (newPassword !== confirmNewPassword) {
    return {
      isValid: false,
      errorCode: 'VALIDATION_ERROR',
      errorMessage: 'New password and confirmation do not match',
    }
  }

  // Check password length requirements using trimmed length to prevent whitespace-only passwords
  const trimmedPassword = newPassword.trim()
  if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      errorCode: 'PASSWORD_REQUIREMENTS_NOT_MET',
      errorMessage: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    }
  }

  if (trimmedPassword.length > MAX_PASSWORD_LENGTH) {
    return {
      isValid: false,
      errorCode: 'PASSWORD_REQUIREMENTS_NOT_MET',
      errorMessage: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`,
    }
  }

  // Prevent setting the same password
  if (currentPassword === newPassword) {
    return {
      isValid: false,
      errorCode: 'PASSWORD_REQUIREMENTS_NOT_MET',
      errorMessage: 'New password must be different from current password',
    }
  }

  return { isValid: true }
}

// ============================================================================
// USE CASE
// ============================================================================

/**
 * Change Password Use Case
 * 
 * Orchestrates the password change process:
 * 1. Validates input
 * 2. Verifies current password against stored hash (via repository)
 * 3. Updates password atomically (via repository)
 * 
 * Follows domain-driven design - depends on AuthRepository interface,
 * not on specific infrastructure implementation.
 */
export class ChangePasswordUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Execute the password change operation
   * 
   * @param userContext - The authenticated user's context (id and email)
   * @param input - Password change input
   * @returns Result indicating success or failure with error details
   * 
   * @security
   * - Uses repository to verify current password (implementation handles timing-safety)
   * - Uses repository to update password (implementation handles hashing)
   * - Never logs raw password values
   */
  async execute(
    userContext: ChangePasswordUserContext,
    input: ChangePasswordInput
  ): Promise<ChangePasswordResult> {
    const { userId, email } = userContext

    // Step 1: Validate input
    const validation = validateInput(input)
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          code: validation.errorCode!,
          message: validation.errorMessage!,
        },
      }
    }

    try {
      // Step 2: Verify current password via repository
      const isPasswordValid = await this.authRepository.verifyPassword(
        email,
        input.currentPassword
      )

      if (!isPasswordValid) {
        // Log the attempt without sensitive data
        console.warn('[CHANGE_PASSWORD] Password verification failed for user:', {
          userId,
          timestamp: new Date().toISOString(),
          // Never log: email, password, error details that could leak info
        })

        // Return generic error to prevent enumeration
        return {
          success: false,
          error: {
            code: 'CURRENT_PASSWORD_INVALID',
            message: 'Current password is incorrect',
          },
        }
      }

      // Step 3: Update password via repository
      await this.authRepository.updatePassword(userId, input.newPassword)

      // Step 4: Success - log audit event
      console.info('[CHANGE_PASSWORD] Password changed successfully:', {
        userId,
        timestamp: new Date().toISOString(),
        event: 'PASSWORD_CHANGED',
      })

      return { success: true }

    } catch (error) {
      // Catch any unexpected errors
      console.error('[CHANGE_PASSWORD] Unexpected error:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })

      // Distinguish between known update failures and unexpected errors
      if (error instanceof Error && error.message.includes('password')) {
        return {
          success: false,
          error: {
            code: 'PASSWORD_UPDATE_FAILED',
            message: 'Failed to update password. Please try again.',
          },
        }
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      }
    }
  }
}
