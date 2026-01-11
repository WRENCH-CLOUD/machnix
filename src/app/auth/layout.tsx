import type { ReactNode } from "react"

// Force dynamic rendering for all auth pages to avoid prerender errors
// with React context providers during static generation
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
