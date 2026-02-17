"use client"

import { useState } from "react"
import { Lock, Sparkles, Zap, Crown, ArrowRight, X, Mail, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePlan } from "@/hooks/use-plan"
import {
    PLAN_DISPLAY,
    UPGRADE_CONTACT,
    normalizeTier,
    type SubscriptionTier,
} from "@/config/plan-features"

// ============================================================================
// UPGRADE REQUIRED MODAL
// ============================================================================

interface UpgradeRequiredModalProps {
    open: boolean
    onClose: () => void
    /** The module or feature that triggered the modal */
    featureName?: string
    /** Custom message to show (overrides default) */
    message?: string
    /** The tier required for the feature */
    requiredTier?: SubscriptionTier
    /** Custom CTA action (e.g., redirect to billing) — falls back to Contact Us */
    onUpgrade?: () => void
}

export function UpgradeRequiredModal({
    open,
    onClose,
    featureName = "this feature",
    message,
    requiredTier,
    onUpgrade,
}: UpgradeRequiredModalProps) {
    const { tier, tierLabel, contactUpgrade } = usePlan()

    if (!open) return null

    const targetTier = requiredTier ? normalizeTier(requiredTier) : (tier === 'basic' ? 'pro' : 'enterprise')
    const targetPlan = PLAN_DISPLAY[targetTier as SubscriptionTier]
    const TierIcon = targetTier === 'enterprise' ? Crown : Zap

    const defaultMessage = `${featureName} is available on the ${targetPlan.displayName} plan. Contact us to upgrade and unlock it for your garage.`

    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade()
        } else {
            contactUpgrade(targetTier as SubscriptionTier)
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                    {/* Gradient Header */}
                    <div className={cn(
                        "relative px-6 pt-8 pb-6",
                        "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent"
                    )}>
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Icon */}
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
                            <TierIcon className="w-8 h-8 text-primary-foreground" />
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-center text-foreground">
                            Upgrade to {targetPlan.displayName}
                        </h2>
                        <p className="mt-2 text-sm text-center text-muted-foreground leading-relaxed">
                            {message || defaultMessage}
                        </p>
                    </div>

                    {/* Features Preview */}
                    <div className="px-6 py-5 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            What you&apos;ll unlock
                        </p>
                        <div className="space-y-2.5">
                            {targetPlan.features.slice(0, 5).map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Sparkles className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-sm text-foreground/80">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA — Contact Us */}
                    <div className="px-6 pb-6 pt-2 flex flex-col gap-2.5">
                        <Button
                            onClick={handleUpgrade}
                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            <span>Contact Us to Upgrade</span>
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full h-9 rounded-xl text-muted-foreground hover:text-foreground text-sm"
                        >
                            Maybe later
                        </Button>
                    </div>

                    {/* Current plan badge */}
                    <div className="px-6 pb-4">
                        <div className="text-center text-xs text-muted-foreground/60">
                            Current plan: <span className="font-medium text-muted-foreground">{tierLabel}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// USAGE LIMIT MODAL 
// ============================================================================

interface UsageLimitModalProps {
    open: boolean
    onClose: () => void
    /** What limit was reached (e.g., 'Jobs', 'Staff') */
    limitType: string
    /** Current usage count */
    currentUsage: number
    /** Maximum allowed */
    maxLimit: number
    /** Custom CTA action — falls back to Contact Us */
    onUpgrade?: () => void
}

export function UsageLimitModal({
    open,
    onClose,
    limitType,
    currentUsage,
    maxLimit,
    onUpgrade,
}: UsageLimitModalProps) {
    const { tierLabel, nextTierLabel, contactUpgrade } = usePlan()

    if (!open) return null

    const percentage = Math.min((currentUsage / Math.max(maxLimit, 1)) * 100, 100)

    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade()
        } else {
            contactUpgrade()
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent">
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                            <Lock className="w-8 h-8 text-white" />
                        </div>

                        <h2 className="text-xl font-bold text-center text-foreground">
                            {limitType} Limit Reached
                        </h2>
                        <p className="mt-2 text-sm text-center text-muted-foreground leading-relaxed">
                            You&apos;ve reached your {maxLimit}-{limitType.toLowerCase()} limit on the {tierLabel} plan.
                            {nextTierLabel && ` Contact us to upgrade to ${nextTierLabel} for more capacity.`}
                        </p>
                    </div>

                    {/* Usage Bar */}
                    <div className="px-6 py-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">{limitType} Usage</span>
                            <span className="text-sm text-muted-foreground">
                                {currentUsage} / {maxLimit}
                            </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    percentage >= 100
                                        ? "bg-gradient-to-r from-red-500 to-red-600"
                                        : percentage >= 80
                                            ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                            : "bg-gradient-to-r from-primary to-primary/80"
                                )}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>

                    {/* CTA — Contact Us */}
                    <div className="px-6 pb-6 pt-2 flex flex-col gap-2.5">
                        {nextTierLabel && (
                            <Button
                                onClick={handleUpgrade}
                                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-lg shadow-amber-500/20 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                Contact Us to Upgrade
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full h-9 rounded-xl text-muted-foreground hover:text-foreground text-sm"
                        >
                            I understand
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// LOCKED FEATURE WRAPPER
// ============================================================================

interface LockedFeatureProps {
    moduleId: string
    children: React.ReactNode
    /** If true, shows a blurred overlay instead of hiding */
    showBlurred?: boolean
    className?: string
}

/**
 * LockedFeature - Wraps content that should be gated by subscription tier.
 * Shows a blurred overlay with upgrade prompt for locked features.
 */
export function LockedFeature({ moduleId, children, showBlurred = true, className }: LockedFeatureProps) {
    const { canAccess, upgradeLabel } = usePlan()
    const [showModal, setShowModal] = useState(false)

    if (canAccess(moduleId)) {
        return <>{children}</>
    }

    if (!showBlurred) return null

    return (
        <>
            <div className={cn("relative", className)}>
                {/* Blurred content */}
                <div className="filter blur-sm pointer-events-none select-none opacity-50">
                    {children}
                </div>

                {/* Overlay */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer bg-background/40 backdrop-blur-[2px] rounded-lg"
                    onClick={() => setShowModal(true)}
                >
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">
                            {upgradeLabel(moduleId)} Feature
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Contact us to upgrade
                        </p>
                    </div>
                </div>
            </div>

            <UpgradeRequiredModal
                open={showModal}
                onClose={() => setShowModal(false)}
                featureName={moduleId}
            />
        </>
    )
}

// ============================================================================
// PRO BADGE
// ============================================================================

interface ProBadgeProps {
    tier?: SubscriptionTier
    size?: "sm" | "md"
    className?: string
}

/**
 * ProBadge - Shows a small badge indicating this feature requires a higher tier.
 */
export function ProBadge({ tier = "pro", size = "sm", className }: ProBadgeProps) {
    const safeTier = normalizeTier(tier)
    const display = PLAN_DISPLAY[safeTier]
    const Icon = safeTier === 'enterprise' ? Crown : Zap

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 font-semibold rounded-full",
                "bg-gradient-to-r from-primary/20 to-primary/10 text-primary",
                "border border-primary/20",
                size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1",
                className
            )}
        >
            <Icon className={cn(size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3")} />
            {display.displayName}
        </span>
    )
}

// ============================================================================
// PAGE-LEVEL ROUTE GUARD
// ============================================================================

interface RouteGuardProps {
    moduleId: string
    children: React.ReactNode
}

/**
 * RouteGuard - Page-level protection for subscription-gated routes.
 * If the user doesn't have access, shows a full-page upgrade prompt
 * instead of the actual content.
 * 
 * @example
 * ```tsx
 * // In a page component:
 * export default function TransactionsPage() {
 *   return (
 *     <RouteGuard moduleId="transactions">
 *       <TransactionsContent />
 *     </RouteGuard>
 *   )
 * }
 * ```
 */
export function RouteGuard({ moduleId, children }: RouteGuardProps) {
    const { canAccess, upgradeLabel, tierLabel, contactUpgrade, requiredTierFor } = usePlan()

    if (canAccess(moduleId)) {
        return <>{children}</>
    }

    const requiredTier = requiredTierFor(moduleId)
    const requiredPlan = PLAN_DISPLAY[requiredTier]
    const TierIcon = requiredTier === 'enterprise' ? Crown : Zap

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md mx-auto space-y-6 px-4">
                {/* Icon */}
                <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                    <Lock className="w-10 h-10 text-primary" />
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {requiredPlan.displayName} Feature
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        This page requires the <strong>{requiredPlan.displayName}</strong> plan.
                        You&apos;re currently on the <strong>{tierLabel}</strong> plan.
                    </p>
                </div>

                {/* Features preview */}
                <div className="bg-card/50 rounded-xl border border-border/60 p-4 text-left">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        {requiredPlan.displayName} includes
                    </p>
                    <div className="space-y-2">
                        {requiredPlan.features.slice(0, 4).map((feat, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                <span className="text-sm text-foreground/80">{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <Button
                    onClick={() => contactUpgrade(requiredTier)}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20"
                >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Us to Upgrade
                </Button>

                <p className="text-xs text-muted-foreground">
                    Questions? Email us at{" "}
                    <a href={`mailto:${UPGRADE_CONTACT.email}`} className="text-primary hover:underline">
                        {UPGRADE_CONTACT.email}
                    </a>
                </p>
            </div>
        </div>
    )
}
