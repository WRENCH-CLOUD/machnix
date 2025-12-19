// "use client"
//TODO: implement mechanic layout as same as the admin layout
// import { type ReactNode, useEffect } from "react"
// import { useRouter, usePathname } from "next/navigation"
// import { useAuth } from "@/providers/auth-provider"
// import Loader from "@/components/ui/loading"

// export default function MechanicLayoutWrapper({
//   children,
// }: {
//   children: ReactNode
// }) {
//   const pathname = usePathname()
//   const router = useRouter()
//   const { user, userRole, loading } = useAuth()

//   /**
//    * Hard authorization gate
//    */
//   useEffect(() => {
//     if (loading) return

//     // Not logged in
//     if (!user) {
//       router.replace("/login")
//       return
//     }

//     // Logged in but wrong role
//     if (userRole !== "platform_admin") {
//       router.replace("/auth/no-access")
//       return
//     }
//   }, [user, userRole, loading, router])

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-background">
//         <Loader
//           title="Verifying access..."
//           subtitle="Please wait"
//           size="lg"
//         />
//       </div>
//     )
//   }

//   // Explicit deny
//   if (!user || userRole !== "mechanic") {
//     return null
//   }

//   const getActiveView = () => {
//     if (pathname.includes("/tenants")) return "tenants"
//     if (pathname.includes("/mechanics")) return "mechanics"
//     if (pathname.includes("/settings")) return "settings"
//     return "overview"
//   }

//   const viewTitles: Record<string, string> = {
//     overview: "Overview",
//     tenants: "Tenants",
//     mechanics: "Mechanics",
//     settings: "Settings",
//   }

//   return (
//     <MechanicLayout
//       activeView={getActiveView()}
//       onViewChange={(view) => {
//         const routes: Record<string, string> = {
//           overview: "/admin",
//           tenants: "/tenants",
//           mechanics: "/mechanics",
//           settings: "/settings",
//         }
//         router.push(routes[view])
//       }}
//       title={viewTitles[getActiveView()]}
//     >
//       {children}
//     </MechanicLayout>
//   )
// }
