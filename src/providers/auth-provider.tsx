"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, setTenantContext, clearTenantContext, getSafeSession } from "@/lib/supabase/client";
import { type SubscriptionTier, normalizeTier } from "@/config/plan-features";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  tenantId: string | null;
  userRole: string | null;
  subscriptionTier: SubscriptionTier;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractClaims(session: Session | null) {
  if (!session?.user) {
    return { role: null, tenantId: null, subscriptionTier: 'basic' as SubscriptionTier };
  }

  const appMeta = session.user.app_metadata;
  const userMeta = session.user.user_metadata;

  return {
    role: appMeta?.role ?? userMeta?.role ?? null,
    tenantId: appMeta?.tenant_id ?? userMeta?.tenant_id ?? null,
    subscriptionTier: normalizeTier(appMeta?.subscription_tier ?? userMeta?.subscription_tier),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('basic');
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);

    const { role, tenantId, subscriptionTier } = extractClaims(session);
    setUserRole(role);
    setTenantId(tenantId);
    setSubscriptionTier(subscriptionTier);

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
        // 1. Try client-side session first (with graceful refresh fallback)
        const { session: clientSession, error: sessionError, recovered } = await getSafeSession();

        if (sessionError) {
          console.error("[AuthProvider] Session fetch error:", sessionError);
        }

        if (clientSession) {
          if (mounted) applySession(clientSession);

          // 2. Always check /api/auth/me for impersonation override and subscription tier
          // This is important for platform admins who may be impersonating a tenant
          const res = await fetch("/api/auth/me");
          if (res.ok && mounted) {
            const { user: serverUser } = await res.json();
            // Always sync subscription tier from server
            if (serverUser?.subscriptionTier) {
              setSubscriptionTier(normalizeTier(serverUser.subscriptionTier));
            }
            if (serverUser?.isImpersonating && serverUser.tenantId) {
              setTenantId(serverUser.tenantId);
              setTenantContext(serverUser.tenantId);
            }
          }
          return;
        }

        if (recovered) {
          if (mounted) applySession(null);
          return;
        }

        // 3. Fallback to server-side session check when no client session
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const { user: serverUser } = await res.json();
          if (serverUser && mounted) {
            setUser(serverUser as any);
            setTenantId(serverUser.tenantId);
            setUserRole(serverUser.role);
            setSubscriptionTier(normalizeTier(serverUser.subscriptionTier));
            if (serverUser.tenantId) setTenantContext(serverUser.tenantId);
          }
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
  }, [applySession]);


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

    // Server has set HttpOnly cookies. Reload page to pick up the session.
    // This is the simplest and most reliable approach for SSR auth.
    window.location.reload();
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
        subscriptionTier,
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
