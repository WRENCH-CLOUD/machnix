import type { ReactNode } from "react";

// Note: Mechanic layout is currently a simple passthrough.
// Per ROADMAP, mechanic dashboard is excluded from V1.
// This layout will be enhanced when mechanic features are added in future versions.

export default function MechanicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
