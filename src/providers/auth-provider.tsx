"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { setTenantContext, clearTenantContext } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  tenantId: string | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractClaims(session: Session | null) {
  if (!session?.user) {
    return { role: null, tenantId: null };
  }

  const appMeta = session.user.app_metadata;
  const userMeta = session.user.user_metadata;

  return {
    role: appMeta?.role ?? userMeta?.role ?? null,
    tenantId: appMeta?.tenant_id ?? userMeta?.tenant_id ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get the browser client (uses cookies, synced with server via middleware)
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const applySession = useCallback((session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);

    const { role, tenantId } = extractClaims(session);
    setUserRole(role);
    setTenantId(tenantId);

    if (session && tenantId) {
      setTenantContext(tenantId);
    } else {
      clearTenantContext();
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Use getUser() instead of getSession() for proper validation
        // The middleware refreshes the session, so cookies should be up to date
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error) {
          // When no user is logged in, getUser() returns an error (typically status 400).
          // This is expected and not a real error condition.
          // Only log errors that might indicate actual problems (e.g., network issues, invalid tokens).
          // Check error status: 400 typically means "no session", which is expected
          if (error.status && error.status !== 400) {
            console.error("[AuthProvider] Auth error:", error.message, "Status:", error.status);
          }
          if (mounted) {
            applySession(null);
            setLoading(false);
          }
          return;
        }

        if (authUser) {
          // Get the full session for the user
          const { data: { session: authSession } } = await supabase.auth.getSession();
          if (mounted) applySession(authSession);

          // Check /api/auth/me for impersonation override (platform admins)
          const res = await fetch("/api/auth/me");
          if (res.ok && mounted) {
            const { user: serverUser } = await res.json();
            if (serverUser?.isImpersonating && serverUser.tenantId) {
              console.log("[AuthProvider] Impersonation active, tenantId:", serverUser.tenantId);
              setTenantId(serverUser.tenantId);
              setTenantContext(serverUser.tenantId);
            }
          }
        } else {
          if (mounted) applySession(null);
        }
      } catch (err) {
        console.error("[AuthProvider] Initialization error:", err);
        if (mounted) applySession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        applySession(session);
        setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, applySession]);


  const signIn = async (email: string, password: string) => {
    // Use server-side login to set HttpOnly cookies
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      let errorMessage = "Invalid credentials";

      if (contentType.includes("application/json")) {
        try {
          const err = await res.json();
          errorMessage = err?.error?.message || errorMessage;
        } catch (e) {
          console.error("Failed to parse error JSON from /api/auth/login", e);
        }
      } else {
        try {
          const text = await res.text();
          console.error("Login failed with non-JSON response:", text?.slice(0, 200));
        } catch (e) {
          console.error("Failed to read error text from /api/auth/login", e);
        }
      }

      throw new Error(errorMessage);
    }

    // Server has set the cookies. Now get the session from the browser client.
    // The middleware will have already refreshed cookies on the next request,
    // but we can get the session directly since cookies are now set.
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !authUser) {
      console.error("Failed to get user after login:", userError);
      throw new Error("Session could not be established. Please sign in again.");
    }

    const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Failed to fetch session after login:", sessionError);
      throw sessionError;
    }

    if (!sessionData) {
      throw new Error("Session could not be established. Please sign in again.");
    }

    applySession(sessionData);
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    await supabase.auth.signOut();
    applySession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        tenantId,
        userRole,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
