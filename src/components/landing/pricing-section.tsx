"use client"

import { useState } from "react"
import { Check, X, Minus, Crown, Zap, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Feature comparison data matching the spec exactly
const comparisonData = {
  categories: [
    {
      name: "Target User",
      features: [
        {
          name: "Ideal For",
          basic: "Single-mechanic garage.",
          pro: "Mid-sized workshops (3-10 staff).",
          enterprise: "Multi-branch/Premium chains.",
        },
        {
          name: 'The "Hook"',
          basic: "Organizes the chaos.",
          pro: "Manages the money (Profit/Loss).",
          enterprise: "Builds the Brand.",
        },
      ],
    },
    {
      name: "Core Modules",
      features: [
        { name: "Dashboard", basic: true, pro: true, enterprise: true },
        { name: "Job Board", basic: true, pro: true, enterprise: true },
        { name: "Customers", basic: true, pro: true, enterprise: true },
        { name: "Vehicles", basic: true, pro: true, enterprise: true },
        { name: "Inventory Management", basic: false, pro: true, enterprise: true },
        { name: "Transactions & Payments", basic: false, pro: true, enterprise: true },
        { name: "Mechanic Management", basic: false, pro: true, enterprise: true },
        { name: "Custom Brand Website", basic: false, pro: false, enterprise: true },
        { name: "Customer Portal", basic: false, pro: false, enterprise: true },
      ],
    },
    {
      name: "GST / Invoicing",
      features: [
        { name: "Basic Receipts", basic: true, pro: true, enterprise: true },
        { name: "Full GST Filing & Tax Reports", basic: false, pro: true, enterprise: true },
        { name: "Multi-GST / Multi-location", basic: false, pro: false, enterprise: true },
      ],
    },
    {
      name: "Communication",
      features: [
        { name: "Email Notifications", basic: true, pro: true, enterprise: true },
        { name: "WhatsApp (Gupshup) Integration", basic: false, pro: true, enterprise: true },
        { name: "Priority WhatsApp Support & Auto-alerts", basic: false, pro: false, enterprise: true },
      ],
    },
    {
      name: "Usage Limits",
      features: [
        { name: "Jobs per Month", basic: "50", pro: "500", enterprise: "Unlimited" },
        { name: "Staff Members", basic: "2", pro: "10", enterprise: "Unlimited" },
      ],
    },
    {
      name: "Support & Extras",
      features: [
        { name: "Advanced Reporting", basic: false, pro: true, enterprise: true },
        { name: "Dedicated Account Manager", basic: false, pro: false, enterprise: true },
        { name: "API Access", basic: false, pro: false, enterprise: true },
      ],
    },
  ],
}

const plans = [
  {
    key: "basic" as const,
    name: "Basic",
    tagline: "Solo/Starter",
    monthlyPrice: "Coming Soon",
    annualPrice: "Coming Soon",
    description: "Perfect for single-mechanic garages getting started.",
    icon: Package,
    popular: false,
    buttonText: "Coming Soon",
    buttonDisabled: true,
  },
  {
    key: "pro" as const,
    name: "Pro",
    tagline: "Growing Shop",
    monthlyPrice: "Coming Soon",
    annualPrice: "Coming Soon",
    description: "Ideal for mid-sized workshops managing growth.",
    icon: Zap,
    popular: true,
    buttonText: "Coming Soon",
    buttonDisabled: true,
  },
  {
    key: "enterprise" as const,
    name: "Enterprise",
    tagline: "The Brand",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    description: "For multi-branch and premium chains.",
    icon: Crown,
    popular: false,
    buttonText: "Coming Soon",
    buttonDisabled: true,
  },
]

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <div className="flex items-center justify-center">
        <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <Check className="w-3 h-3 text-emerald-400" strokeWidth={3} />
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-center">
        <Minus className="w-4 h-4 text-zinc-600" />
      </div>
    )
  }
  return (
    <span className="text-sm text-zinc-300 font-medium">{value}</span>
  )
}

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)
  const [showComparison, setShowComparison] = useState(false)

  return (
    <section
      id="pricing-section"
      className="w-full px-6 md:px-10 lg:px-16 overflow-hidden flex flex-col justify-start items-center my-0 py-12 md:py-20"
    >
      {/* Header */}
      <div className="relative flex flex-col justify-center items-center gap-2 py-0 max-w-2xl mx-auto">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="text-center text-foreground text-4xl md:text-5xl font-semibold leading-tight">
            Pricing built for every shop
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-relaxed">
            Choose a plan that fits your shop size, from single-bay garages <br /> to multi-location
            operations.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="pt-4">
          <div className="p-0.5 bg-muted rounded-lg outline outline-1 outline-[#0307120a] outline-offset-[-1px] flex justify-start items-center gap-1">
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                "pl-2 pr-1 py-1 flex justify-start items-start gap-2 rounded-md transition-all duration-200",
                isAnnual
                  ? "bg-accent shadow-[0px_1px_1px_-0.5px_rgba(0,0,0,0.08)]"
                  : ""
              )}
            >
              <span className={cn("text-center text-sm font-medium leading-tight", isAnnual ? "text-accent-foreground" : "text-zinc-400")}>
                Annually
              </span>
            </button>
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                "px-2 py-1 flex justify-start items-start rounded-md transition-all duration-200",
                !isAnnual
                  ? "bg-accent shadow-[0px_1px_1px_-0.5px_rgba(0,0,0,0.08)]"
                  : ""
              )}
            >
              <span className={cn("text-center text-sm font-medium leading-tight", !isAnnual ? "text-accent-foreground" : "text-zinc-400")}>
                Monthly
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="self-stretch px-4 md:px-8 flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-8 mt-8 max-w-[1200px] mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon
          return (
            <div
              key={plan.name}
              className={cn(
                "flex-1 p-6 md:p-8 overflow-hidden rounded-xl flex flex-col justify-start items-start gap-6 transition-all duration-300",
                plan.popular
                  ? "bg-primary shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.10)] ring-1 ring-primary/50"
                  : "bg-gradient-to-b from-gray-50/5 to-gray-50/0",
                !plan.popular && "outline outline-1 outline-border outline-offset-[-1px]"
              )}
            >
              <div className="self-stretch flex flex-col justify-start items-start gap-6">
                <div className="self-stretch flex flex-col justify-start items-start gap-8">
                  {/* Plan name + badge */}
                  <div className={cn(
                    "w-full flex items-center gap-2",
                    plan.popular ? "text-primary-foreground" : "text-zinc-200"
                  )}>
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-semibold leading-tight">{plan.name}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      plan.popular
                        ? "bg-white/20 text-primary-foreground/80"
                        : "bg-zinc-800 text-zinc-400"
                    )}>
                      {plan.tagline}
                    </span>
                    {plan.popular && (
                      <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-primary-foreground">
                        Popular
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <div className="flex justify-start items-center gap-1.5">
                      <div className={cn(
                        "relative h-10 flex items-center text-3xl font-medium leading-10",
                        plan.popular ? "text-primary-foreground" : "text-zinc-50"
                      )}>
                        <span className="invisible">
                          {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                        </span>
                        <span
                          className="absolute inset-0 flex items-center transition-all duration-500"
                          style={{
                            opacity: isAnnual ? 1 : 0,
                            transform: `scale(${isAnnual ? 1 : 0.8})`,
                            filter: `blur(${isAnnual ? 0 : 4}px)`,
                          }}
                        >
                          {plan.annualPrice}
                        </span>
                        <span
                          className="absolute inset-0 flex items-center transition-all duration-500"
                          style={{
                            opacity: !isAnnual ? 1 : 0,
                            transform: `scale(${!isAnnual ? 1 : 0.8})`,
                            filter: `blur(${!isAnnual ? 0 : 4}px)`,
                          }}
                        >
                          {plan.monthlyPrice}
                        </span>
                      </div>
                      {plan.monthlyPrice !== "Custom" && (
                        <span className={cn(
                          "text-sm font-medium leading-tight",
                          plan.popular ? "text-primary-foreground/70" : "text-zinc-400"
                        )}>
                          /month
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm font-medium leading-tight",
                      plan.popular ? "text-primary-foreground/70" : "text-zinc-400"
                    )}>
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Button */}
                <Button
                  disabled={plan.buttonDisabled}
                  className={cn(
                    "self-stretch px-5 py-2 rounded-[40px] flex justify-center items-center transition-all duration-200",
                    plan.popular
                      ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      : plan.key === "basic"
                        ? "bg-zinc-200 text-gray-500 cursor-not-allowed"
                        : "bg-secondary text-white hover:bg-secondary/90"
                  )}
                >
                  <span className="text-sm font-medium">{plan.buttonText}</span>
                </Button>
              </div>

              {/* Features */}
              <div className="self-stretch flex flex-col justify-start items-start gap-4">
                <span className={cn(
                  "text-sm font-medium",
                  plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {plan.key === "basic"
                    ? "Get started today:"
                    : plan.key === "pro"
                      ? "Everything in Basic +"
                      : "Everything in Pro +"}
                </span>
                <div className="self-stretch flex flex-col justify-start items-start gap-3">
                  {comparisonData.categories
                    .find(c => c.name === "Core Modules")
                    ?.features.filter(f => f[plan.key] === true)
                    .map((feature) => (
                      <div key={feature.name} className="self-stretch flex justify-start items-center gap-2">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <Check
                            className={cn("w-full h-full", plan.popular ? "text-primary-foreground" : "text-muted-foreground")}
                            strokeWidth={2}
                          />
                        </div>
                        <span className={cn(
                          "text-sm font-normal leading-tight",
                          plan.popular ? "text-primary-foreground" : "text-muted-foreground"
                        )}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  {/* Usage limits */}
                  {comparisonData.categories
                    .find(c => c.name === "Usage Limits")
                    ?.features.map((feature) => (
                      <div key={feature.name} className="self-stretch flex justify-start items-center gap-2">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <Check
                            className={cn("w-full h-full", plan.popular ? "text-primary-foreground" : "text-muted-foreground")}
                            strokeWidth={2}
                          />
                        </div>
                        <span className={cn(
                          "text-sm font-normal leading-tight",
                          plan.popular ? "text-primary-foreground" : "text-muted-foreground"
                        )}>
                          {feature[plan.key]} {feature.name}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature Comparison Toggle */}
      <div className="mt-10 flex flex-col items-center">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <span>{showComparison ? "Hide" : "View full"} feature comparison</span>
          <ArrowRight className={cn(
            "w-4 h-4 transition-transform duration-300",
            showComparison ? "rotate-90" : ""
          )} />
        </button>
      </div>

      {/* Feature Comparison Table */}
      {showComparison && (
        <div className="w-full max-w-[1200px] mx-auto mt-8 overflow-x-auto animate-in slide-in-from-top-4 duration-500">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground w-[40%]" />
                {plans.map((plan) => {
                  const Icon = plan.icon
                  return (
                    <th key={plan.key} className="text-center py-4 px-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className={cn(
                          "flex items-center gap-1.5",
                          plan.popular ? "text-primary" : "text-zinc-300"
                        )}>
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-bold">{plan.name}</span>
                        </div>
                        <span className="text-xs text-zinc-500">({plan.tagline})</span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {comparisonData.categories.map((category) => (
                <>
                  <tr key={`cat-${category.name}`}>
                    <td
                      colSpan={4}
                      className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-primary border-b border-border/30"
                    >
                      {category.name}
                    </td>
                  </tr>
                  {category.features.map((feature, idx) => (
                    <tr
                      key={`${category.name}-${idx}`}
                      className="border-b border-border/10 hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-zinc-300">{feature.name}</td>
                      <td className="py-3 px-4 text-center">
                        <FeatureValue value={feature.basic} />
                      </td>
                      <td className={cn(
                        "py-3 px-4 text-center",
                        "bg-primary/5"
                      )}>
                        <FeatureValue value={feature.pro} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <FeatureValue value={feature.enterprise} />
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
