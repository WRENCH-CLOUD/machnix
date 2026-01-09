/**
 * Next.js Middleware
 * 
 * This file delegates to the proxy module which handles:
 * - Supabase session refresh (cookie-based auth)
 * - Route protection (public vs protected routes)
 * - Security headers
 * 
 * @see src/proxy.ts for implementation details
 */

import { proxy } from "@/proxy";

export { proxy as middleware };

// Config must be defined directly here (can't be re-exported)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

