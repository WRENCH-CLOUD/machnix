/**
 * Change Password Types and Validation Schema
 * 
 * Provides type definitions and validation rules for password change operations.
 * Designed for use with forms (react-hook-form) and API validation.
 * 
 * @module access/domain/change-password.schema
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum password length requirement */
export const PASSWORD_MIN_LENGTH = 8

/** Maximum password length to prevent DoS attacks */
export const PASSWORD_MAX_LENGTH = 128

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input for password change request
 */
export interface ChangePasswordRequest {
  /** The user's current password for verification */
  currentPassword: string
  /** The new password to set */
  newPassword: string
  /** Confirmation of the new password (must match newPassword) */
  confirmNewPassword: string
}

/**
 * Successful password change response
 */
export interface ChangePasswordSuccessResponse {
  success: true
  message: string
}

/**
 * Failed password change response
 */
export interface ChangePasswordErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

/**
 * Combined response type for password change API
 */
export type ChangePasswordResponse = 
  | ChangePasswordSuccessResponse 
  | ChangePasswordErrorResponse

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validation error structure
 */
export interface ValidationError {
  field: keyof ChangePasswordRequest | 'general'
  message: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Validates password change input on the client side
 * This mirrors the server-side validation for immediate feedback
 * 
 * @param input - The password change request to validate
 * @returns Validation result with any errors
 */
export function validateChangePasswordInput(
  input: Partial<ChangePasswordRequest>
): ValidationResult {
  const errors: ValidationError[] = []

  // Current password validation
  if (!input.currentPassword || input.currentPassword.trim().length === 0) {
    errors.push({
      field: 'currentPassword',
      message: 'Current password is required',
    })
  }

  // New password validation
  if (!input.newPassword || input.newPassword.trim().length === 0) {
    errors.push({
      field: 'newPassword',
      message: 'New password is required',
    })
  } else {
    if (input.newPassword.length < PASSWORD_MIN_LENGTH) {
      errors.push({
        field: 'newPassword',
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      })
    }

    if (input.newPassword.length > PASSWORD_MAX_LENGTH) {
      errors.push({
        field: 'newPassword',
        message: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`,
      })
    }

    // Check if new password is same as current
    if (input.currentPassword && input.newPassword === input.currentPassword) {
      errors.push({
        field: 'newPassword',
        message: 'New password must be different from current password',
      })
    }
  }

  // Confirm password validation
  if (!input.confirmNewPassword) {
    errors.push({
      field: 'confirmNewPassword',
      message: 'Password confirmation is required',
    })
  } else if (input.newPassword && input.confirmNewPassword !== input.newPassword) {
    errors.push({
      field: 'confirmNewPassword',
      message: 'Passwords do not match',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

/**
 * Evaluates password strength for UI feedback
 * This is purely for UX - server enforces minimum requirements
 * 
 * @param password - Password to evaluate
 * @returns Strength level
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak'

  let score = 0

  // Length checks
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character diversity checks
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  // Map score to strength
  if (score <= 2) return 'weak'
  if (score <= 4) return 'fair'
  if (score <= 6) return 'good'
  return 'strong'
}
