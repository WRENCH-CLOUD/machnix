import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { redirectByRole } from "@/lib/supabase/proxy";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          response = NextResponse.next({ request })

          cookies.forEach(({ name, value, options }) => {
            const mergedOptions = {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              ...options,
            }
            response.cookies.set(name, value, mergedOptions)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ---------------------------
  // SECURITY HEADERS
  // ---------------------------
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // ---------------------------
  // API ROUTES PROTECTION
  // ---------------------------
  if (pathname.startsWith("/api")) {
    const PUBLIC_API_ROUTES = [
      "/api/auth/login",
      "/api/auth/logout",
      "/api/auth/me",
      "/api/callbacks",
    ];

    if (!user && !PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return response;
  }

  // ---------------------------
  // PUBLIC ROUTES
  // ---------------------------
  const PUBLIC_ROUTES = [
    "/",           // Landing page
    "/login",      // Login page
    "/auth",       // Auth-related pages
  ];

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicRoute) {
    // If user is logged in and on login page, redirect by role
    if (user && pathname.startsWith("/login")) {
      return redirectByRole(request, user);
    }
    return response;
  }

  // ---------------------------
  // PROTECTED ROUTES
  // ---------------------------
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Exclude static assets from middleware, but INCLUDE API routes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
