"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, setTenantContext } from "@/lib/supabase/client";

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

  const applySession = (session: Session | null) => {
  setSession(session);
  setUser(session?.user ?? null);

  const { role, tenantId } = extractClaims(session);
  setUserRole(role);
  setTenantId(tenantId);

  if (tenantId) setTenantContext(tenantId);
};

useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // 1. Try client-side session first
        const { data: { session: clientSession } } = await supabase.auth.getSession();
        
        if (clientSession) {
          if (mounted) applySession(clientSession);
        } else {
          // 2. Fallback to server-side session check
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const { user: serverUser } = await res.json();
            if (serverUser && mounted) {
              // Construct a minimal session-like object for applySession
              // or handle serverUser directly
              setUser(serverUser as any);
              setTenantId(serverUser.tenantId);
              setUserRole(serverUser.role);
              if (serverUser.tenantId) setTenantContext(serverUser.tenantId);
            }
          }
        }
      } catch (err) {
        console.error("[AuthProvider] Initialization error:", err);
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
  }, []);


  const signIn = async (email: string, password: string) => {
    // Use server-side login to set HttpOnly cookies, then sync client session
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
          const err= await res.json();
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

    // On success, do NOT consume tokens. Fetch the client session (cookie-backed).
    // This keeps tokens out of JS memory and Local Storage.
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Failed to fetch session after login:", error);
      throw error;
    }

    applySession(sessionData.session);
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
