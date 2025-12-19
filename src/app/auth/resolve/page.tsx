"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loading";
import { resolveRedirect } from "@/lib/auth/resolve-redirect";

export default function AuthResolvePage() {
  console.log("AUTH RESOLVE HIT");

  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;

    const resolve = async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!res.ok) {
        hasRedirected.current = true;
        router.replace("/login");
        return;
      }

      const { user } = await res.json();

      const target = resolveRedirect({
        role: user.role,
        tenantId: user.tenantId,
      });

      hasRedirected.current = true;
      router.replace(target);
    };

    resolve();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader
        title="Signing you in…"
        subtitle="Resolving access"
        size="lg"
      />
    </div>
  );
}
