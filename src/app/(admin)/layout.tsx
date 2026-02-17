"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { AdminLayout } from "@/components/admin/admin-layout";

export default function AdminLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, userRole } = useAuth();

  useEffect(() => {
    // Explicit deny only
    if (session && userRole && userRole !== "platform_admin") {
      router.replace("/auth/no-access");
    }
  }, [session, userRole, router]);

  // --- UI STATE HELPERS ---
  const getActiveView = () => {
    if (pathname.includes("/analytics")) return "analytics";
    if (pathname.includes("/tenants")) return "tenants";
    if (pathname.includes("/leads")) return "leads";
    if (pathname.includes("/mechanics")) return "mechanics";
    if (pathname.includes("/settings")) return "settings";
    return "overview";
  };

  const viewTitles: Record<string, string> = {
    overview: "Overview",
    tenants: "Tenants",
    analytics: "Revenue",
    leads: "Leads",
    mechanics: "Mechanics",
    settings: "Settings",
  };

  // 🔑 ALWAYS render the layout shell
  return (
    <AdminLayout
      activeView={getActiveView()}
      onViewChange={(view) => {
        const routes: Record<string, string> = {
          overview: "/admin",
          tenants: "/tenants",
          analytics: "/admin/analytics",
          leads: "/admin/leads",
          mechanics: "/mechanics",
          settings: "/settings",
        };
        router.push(routes[view]);
      }}
      title={viewTitles[getActiveView()]}
    >
      {children}
    </AdminLayout>
  );
}
