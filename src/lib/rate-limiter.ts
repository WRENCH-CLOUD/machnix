/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store - for production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute
let cleanupTimer: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Custom key generator (default: IP-based) */
  keyGenerator?: (request: Request) => string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfterMs?: number
}

/**
 * Default rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  /** Standard API calls: 100 requests per minute */
  STANDARD: { maxRequests: 100, windowMs: 60 * 1000 },
  /** Auth endpoints: 10 requests per minute (stricter) */
  AUTH: { maxRequests: 10, windowMs: 60 * 1000 },
  /** Write operations: 30 requests per minute */
  WRITE: { maxRequests: 30, windowMs: 60 * 1000 },
  /** Payment operations: 5 requests per minute (strictest) */
  PAYMENT: { maxRequests: 5, windowMs: 60 * 1000 },
  /** Search/read operations: 200 requests per minute (lenient) */
  READ: { maxRequests: 200, windowMs: 60 * 1000 },
} as const

/**
 * Extract client identifier from request
 */
function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers (when behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfIp = request.headers.get('cf-connecting-ip') // Cloudflare
  
  // Use first IP in forwarded chain, or fall back to other headers
  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfIp || 'unknown'
  
  return ip
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
  additionalKey?: string
): RateLimitResult {
  startCleanup()
  
  const clientId = config.keyGenerator?.(request) ?? getClientIdentifier(request)
  const key = additionalKey ? `${clientId}:${additionalKey}` : clientId
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
    
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    }
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfterMs: entry.resetTime - now,
    }
  }
  
  // Increment counter
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Create a rate-limited response with appropriate headers
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSeconds = Math.ceil((result.retryAfterMs || 0) / 1000)
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`,
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
      },
    }
  )
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult,
  config: RateLimitConfig
): Response {
  const newHeaders = new Headers(response.headers)
  newHeaders.set('X-RateLimit-Limit', String(config.maxRequests))
  newHeaders.set('X-RateLimit-Remaining', String(result.remaining))
  newHeaders.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)))
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

/**
 * Higher-order function to wrap an API handler with rate limiting
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<Response>>(
  handler: T,
  config: RateLimitConfig = RATE_LIMITS.STANDARD,
  routeKey?: string
): T {
  return (async (request: Request, ...args: unknown[]) => {
    const result = checkRateLimit(request, config, routeKey)
    
    if (!result.success) {
      return createRateLimitResponse(result)
    }
    
    const response = await handler(request, ...args)
    return addRateLimitHeaders(response, result, config)
  }) as T
}

/**
 * User-specific rate limiting (for authenticated requests)
 */
export function checkUserRateLimit(
  userId: string,
  config: RateLimitConfig,
  action?: string
): RateLimitResult {
  startCleanup()
  
  const key = action ? `user:${userId}:${action}` : `user:${userId}`
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
    
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    }
  }
  
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfterMs: entry.resetTime - now,
    }
  }
  
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}
