/**
 * Environment Variable Validation
 *
 * This module validates required environment variables at startup and provides
 * clear error messages when configuration is missing.
 *
 * Usage:
 * - Import `validateEnv()` at application startup
 * - Use `env` object for type-safe access to validated environment variables
 * - Use `getEnvStatus()` for health check endpoints
 */

/**
 * Environment variable configuration schema
 */
interface EnvConfig {
  /** Variable name */
  name: string
  /** Is this variable required for the app to function? */
  required: boolean
  /** Is this a server-only variable (should not be exposed to client)? */
  serverOnly?: boolean
  /** Description for error messages */
  description: string
  /** Example value for documentation */
  example?: string
}

/**
 * All environment variables used by the application
 */
const ENV_SCHEMA: EnvConfig[] = [
  // Core Supabase Configuration (Required)
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    example: 'https://your-project.supabase.co',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous/public key for client-side operations',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    serverOnly: true,
    description: 'Supabase service role key for admin operations (KEEP SECRET)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },

  // Application Configuration
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: false,
    description: 'Public URL of the application',
    example: 'http://localhost:3000',
  },
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Node environment (development, production, test)',
    example: 'development',
  },

  // Supabase Storage (Optional - for S3-compatible file uploads)
  {
    name: 'SUPABASE_S3_ACCESS_KEY',
    required: false,
    serverOnly: true,
    description: 'S3 access key for Supabase storage',
  },
  {
    name: 'SUPABASE_S3_SECRET_KEY',
    required: false,
    serverOnly: true,
    description: 'S3 secret key for Supabase storage',
  },
  {
    name: 'SUPABASE_S3_ENDPOINT',
    required: false,
    serverOnly: true,
    description: 'S3 endpoint URL for Supabase storage',
    example: 'https://your-project.supabase.co/storage/v1/s3',
  },
  {
    name: 'SUPABASE_REGION',
    required: false,
    serverOnly: true,
    description: 'AWS region for Supabase storage',
  },

  // Payment Processing (Optional)
  {
    name: 'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    required: false,
    description: 'Razorpay public key for payment processing',
  },
  {
    name: 'RAZORPAY_KEY_SECRET',
    required: false,
    serverOnly: true,
    description: 'Razorpay secret key for payment verification',
  },

  // Communication (Optional)
  {
    name: 'TWILIO_ACCOUNT_SID',
    required: false,
    serverOnly: true,
    description: 'Twilio account SID for notifications',
  },
  {
    name: 'TWILIO_AUTH_TOKEN',
    required: false,
    serverOnly: true,
    description: 'Twilio auth token for notifications',
  },
]

/**
 * Validation result for an environment variable
 */
export interface EnvValidationResult {
  name: string
  valid: boolean
  required: boolean
  serverOnly: boolean
  present: boolean
  description: string
  error?: string
}

/**
 * Overall environment status
 */
export interface EnvStatus {
  valid: boolean
  timestamp: string
  environment: string
  results: EnvValidationResult[]
  missingRequired: string[]
  missingOptional: string[]
}

/**
 * Validate a single environment variable
 */
function validateEnvVar(config: EnvConfig): EnvValidationResult {
  const value = process.env[config.name]
  const present = value !== undefined && value !== ''

  const result: EnvValidationResult = {
    name: config.name,
    valid: true,
    required: config.required,
    serverOnly: config.serverOnly ?? false,
    present,
    description: config.description,
  }

  if (config.required && !present) {
    result.valid = false
    result.error = `Required environment variable ${config.name} is missing. ${config.description}${config.example ? ` Example: ${config.example}` : ''}`
  }

  return result
}

/**
 * Get the status of all environment variables
 * Used by health check endpoints
 */
export function getEnvStatus(): EnvStatus {
  const results = ENV_SCHEMA.map(validateEnvVar)
  const missingRequired = results.filter((r) => r.required && !r.present).map((r) => r.name)
  const missingOptional = results.filter((r) => !r.required && !r.present).map((r) => r.name)

  return {
    valid: missingRequired.length === 0,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'unknown',
    results,
    missingRequired,
    missingOptional,
  }
}

/**
 * Validate all required environment variables
 * Throws an error with detailed message if validation fails
 *
 * Call this at application startup to fail fast
 */
export function validateEnv(): void {
  const status = getEnvStatus()

  if (!status.valid) {
    const errorMessages = status.results
      .filter((r) => !r.valid)
      .map((r) => `  ❌ ${r.error}`)
      .join('\n')

    const message = `
╔════════════════════════════════════════════════════════════════════╗
║                    ENVIRONMENT CONFIGURATION ERROR                  ║
╠════════════════════════════════════════════════════════════════════╣
║ The application cannot start due to missing required configuration.║
║                                                                    ║
║ Missing required environment variables:                            ║
${status.missingRequired.map((v) => `║   • ${v.padEnd(60)}║`).join('\n')}
║                                                                    ║
║ Please ensure these variables are set in your .env.local file      ║
║ or in your deployment environment.                                 ║
║                                                                    ║
║ See .env.example for reference values.                             ║
╚════════════════════════════════════════════════════════════════════╝

Detailed errors:
${errorMessages}
`
    console.error(message)
    throw new Error(`Missing required environment variables: ${status.missingRequired.join(', ')}`)
  }

  // Log successful validation in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment variables validated successfully')
    if (status.missingOptional.length > 0) {
      console.log(`ℹ️  Optional variables not configured: ${status.missingOptional.join(', ')}`)
    }
  }
}

/**
 * Type-safe access to validated environment variables
 *
 * Use this instead of process.env for type safety and autocomplete
 */
export const env = {
  // Core Supabase
  get SUPABASE_URL() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL!
  },
  get SUPABASE_ANON_KEY() {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY!
  },

  // Application
  get APP_URL() {
    return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  },
  get NODE_ENV() {
    return (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test'
  },
  get isDevelopment() {
    return this.NODE_ENV === 'development'
  },
  get isProduction() {
    return this.NODE_ENV === 'production'
  },

  // Supabase Storage (Optional)
  get SUPABASE_S3_ACCESS_KEY() {
    return process.env.SUPABASE_S3_ACCESS_KEY
  },
  get SUPABASE_S3_SECRET_KEY() {
    return process.env.SUPABASE_S3_SECRET_KEY
  },
  get SUPABASE_S3_ENDPOINT() {
    return process.env.SUPABASE_S3_ENDPOINT
  },
  get SUPABASE_REGION() {
    return process.env.SUPABASE_REGION
  },
  get hasStorageConfig() {
    return !!(this.SUPABASE_S3_ACCESS_KEY && this.SUPABASE_S3_SECRET_KEY && this.SUPABASE_S3_ENDPOINT)
  },

  // Razorpay (Optional)
  get RAZORPAY_KEY_ID() {
    return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  },
  get RAZORPAY_KEY_SECRET() {
    return process.env.RAZORPAY_KEY_SECRET
  },
  get hasRazorpayConfig() {
    return !!(this.RAZORPAY_KEY_ID && this.RAZORPAY_KEY_SECRET)
  },

  // Twilio (Optional)
  get TWILIO_ACCOUNT_SID() {
    return process.env.TWILIO_ACCOUNT_SID
  },
  get TWILIO_AUTH_TOKEN() {
    return process.env.TWILIO_AUTH_TOKEN
  },
  get hasTwilioConfig() {
    return !!(this.TWILIO_ACCOUNT_SID && this.TWILIO_AUTH_TOKEN)
  },
} as const
