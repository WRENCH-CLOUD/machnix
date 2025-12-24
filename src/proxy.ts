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
          );

          response = NextResponse.next({ request });

          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ---------------------------
  // BYPASS MIDDLEWARE FOR API ROUTES
  // ---------------------------
  if (pathname.startsWith("/api")) {
    return response;
  }

  // ---------------------------
  // PUBLIC ROUTES
  // ---------------------------
  if (pathname.startsWith("/login")) {
    if (user) {
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
    // Exclude API endpoints and static assets from middleware
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
