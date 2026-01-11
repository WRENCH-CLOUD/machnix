// Application configuration constants

export const APP_CONFIG = {
  name: "wrench-cloud",
  description: "Professional multi-tenant garage management system",
  version: "1.0.0",
} as const

export const ROUTES = {
  home: "/",
  auth: {
    login: "/auth/login",
    callback: "/auth/callback",
    noAccess: "/auth/no-access",
  },
  dashboard: "/dashboard",
  jobs: "/jobs",
  customers: "/customers",
  vehicles: "/vehicles",
  reports: "/reports",
  settings: "/settings",
} as const

export const API_ROUTES = {
  admin: "/api/admin",
} as const

// Re-export statusConfig from domain for backward compatibility
export { statusConfig } from "@/modules/job/domain/job.entity"
