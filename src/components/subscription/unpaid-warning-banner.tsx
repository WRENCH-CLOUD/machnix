"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Clock, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"

interface SubscriptionState {
    validity: 'active' | 'trial' | 'grace_period' | 'expired'
    isInGracePeriod: boolean
    isExpired: boolean
    daysUntilExpiry: number | null
    gracePeriodEndsAt: string | null
    trialEndsAt: string | null
}

export function UnpaidWarningBanner() {
    const { session } = useAuth()
    const router = useRouter()
    const [state, setState] = useState<SubscriptionState | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Only fetch if authenticated
        if (!session?.user) return

        fetch('/api/subscription/me')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setState(data.state)
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [session])

    if (loading || !state) return null

    // Helper to calculate days remaining from a date string
    const getDaysRemaining = (dateStr: string | null) => {
        if (!dateStr) return 0
        const target = new Date(dateStr)
        const now = new Date()
        return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }

    // Trial Warning (last 3 days)
    if (state.validity === 'trial') {
        const daysLeft = getDaysRemaining(state.trialEndsAt)
        if (daysLeft <= 3) {
            return (
                <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-sm text-blue-700 dark:text-blue-300 transform transition-all duration-300 ease-in-out">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span className="text-center">
                        Your free trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Upgrade now to keep using premium features.
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-900"
                        onClick={() => router.push('/settings')}
                    >
                        Upgrade Plan
                    </Button>
                </div>
            )
        }
        return null
    }

    // Grace Period Warning
    if (state.isInGracePeriod) {
        const daysLeft = getDaysRemaining(state.gracePeriodEndsAt)
        return (
            <div className="bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-800 px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-sm text-orange-700 dark:text-orange-300 animate-in slide-in-from-top-2 duration-300">
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-center font-medium">
                    Payment Past Due. Access will be restricted in {daysLeft} day{daysLeft !== 1 ? 's' : ''}.
                </span>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-orange-300 bg-white hover:bg-orange-50 text-orange-700 dark:bg-orange-900/50 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900"
                    onClick={() => router.push('/settings')}
                >
                    Update Payment
                </Button>
            </div>
        )
    }

    // Expired Warning
    if (state.validity === 'expired' || state.isExpired) {
        return (
            <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-sm text-red-700 dark:text-red-300 animate-in slide-in-from-top-2 duration-300">
                <CreditCard className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-center font-bold">
                    Subscription Expired. Update payment method to restore access.
                </span>
                <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs shadow-sm hover:bg-red-600"
                    onClick={() => router.push('/settings')}
                >
                    Resubscribe
                </Button>
            </div>
        )
    }

    return null
}
