import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { headers } from "next/headers"

// Simple in-memory rate limiter
// In production, use Redis or a dedicated rate limiting service
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = {
  maxRequests: 3,      // Max requests per window
  windowMs: 60 * 1000, // 1 minute window
}

function getRateLimitKey(request: Request): string {
  const headersList = headers()
  // Use X-Forwarded-For for proxied requests, fallback to a hash of user agent
  const forwarded = headersList.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || "unknown"
  return `callback:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) {
      if (v.resetTime < now) rateLimitMap.delete(k)
    }
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs })
    return { allowed: true }
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  record.count++
  return { allowed: true }
}

// Basic email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Basic phone validation (allows various formats)
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "")
  return /^\+?[0-9]{10,15}$/.test(cleaned)
}

// Sanitize input to prevent XSS
function sanitize(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 500) // Limit length
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request)
    const { allowed, retryAfter } = checkRateLimit(rateLimitKey)

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: { "Retry-After": String(retryAfter) }
        }
      )
    }

    const body = await request.json()
    const { name, email, phone, garageName, message } = body

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required" },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Validate phone format
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitize(name),
      email: sanitize(email),
      phone: sanitize(phone),
      garage_name: garageName ? sanitize(garageName) : null,
      message: message ? sanitize(message) : null,
      source: "website",
      status: "new",
    }

    // Use service role to insert (bypasses RLS)
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from("leads")
      .insert(sanitizedData)
      .select()
      .single()

    if (error) {
      console.error("Failed to insert lead:", error)
      return NextResponse.json(
        { error: "Failed to save request" },
        { status: 500 }
      )
    }

    console.log("📞 New demo request saved:", data.id)

    return NextResponse.json({ 
      success: true, 
      message: "Demo request received",
      id: data.id 
    })
  } catch (error) {
    console.error("Failed to process callback request:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
