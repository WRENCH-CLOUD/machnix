// Application configuration constants

export const APP_CONFIG = {
  name: "Mechanix",
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

// Status colors for consistent styling
export const statusConfig = {
  received: {
    label: "Received",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  working: {
    label: "Working",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  ready: {
    label: "Ready for Payment",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  completed: {
    label: "Completed",
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
  },
  cancelled: { // TODO: needs actual implementation
    label: "Cancelled",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
} as const
