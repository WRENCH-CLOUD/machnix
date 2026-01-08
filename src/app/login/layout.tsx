import type { ReactNode } from "react"

// Force dynamic rendering for login page to avoid prerender errors
// with React context providers (useAuth) during static generation
export const dynamic = 'force-dynamic'

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
