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

  const meta = session.user.app_metadata ;

  return {
    role: meta?.role ?? null,
    tenantId: meta?.tenant_id ?? null,
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
  supabase.auth.getSession().then(({ data }) => {
    applySession(data.session);
    setLoading(false);
  });

  const { data: { subscription } } =
    supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

  return () => subscription.unsubscribe();
}, []);


  const signIn = async (email: string, password: string) => {
    console.log("AUTH SIGN IN CALLED");

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
          const err: any = await res.json();
          errorMessage = err?.error?.message || err?.error || errorMessage;
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

    let payload: any;
    if (contentType.includes("application/json")) {
      payload = await res.json();
    } else {
      // Unexpected non-JSON response
      const text = await res.text();
      console.error("Unexpected non-JSON success response from /api/auth/login:", text?.slice(0, 200));
      throw new Error("Login failed due to server error. Please try again.");
    }

    const { session } = payload;

    // Sync client-side Supabase session so client SDK is authenticated
    const { data, error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    console.log("CLIENT SESSION SYNC", { error, session: data?.session?.user?.id });
    if (error) throw error;
  };

  const signOut = async () => {
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
