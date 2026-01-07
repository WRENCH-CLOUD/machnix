/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js at startup.
 * It runs once when the server starts, making it ideal for:
 * - Environment variable validation
 * - Database connection checks
 * - Other startup initialization
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only validate on server-side startup (not during build or client-side)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./src/lib/env')

    try {
      validateEnv()
      console.log('🚀 Mechanix server starting...')
    } catch (error) {
      // In production, exit the process to prevent unhealthy server
      if (process.env.NODE_ENV === 'production') {
        console.error('💥 Failed to start server due to configuration errors')
        process.exit(1)
      }
      // In development, log error but allow server to continue for debugging
      console.error('⚠️  Server starting with configuration warnings:', error)
    }
  }
}
