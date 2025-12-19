export function resolveRedirect(user: {
  role?: string
  tenantId?: string
}) {
  if (user.role === "platform_admin") return "/admin"
  if (user.role === "mechanic") return "/mechanic"
  if (user.tenantId) return "/tenant"
  return "/auth/no-access"
}
