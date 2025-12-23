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

  const meta = session.user.app_metadata as any;

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

    if (tenantId) {
      setTenantContext(tenantId);
    }
  };

  useEffect(() => {
    // 🔑 INITIAL LOAD
    setLoading(true);
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
      setLoading(false);
    });

    // 🔑 AUTH STATE CHANGES (login / logout / refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);              // ✅ ADD THIS
      applySession(session);
      setLoading(false);             // ✅ ADD THIS
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("AUTH SIGN IN CALLED");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Invalid credentials");
    }
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
