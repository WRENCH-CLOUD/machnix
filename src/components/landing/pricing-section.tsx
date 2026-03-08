"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Basic",
      monthlyPrice: "Coming Soon", //TODO: Update to the real price
      annualPrice: "Coming Soon", //TODO: Update to the real price
      description: "Perfect for small shops getting started.",
      features: [
        "Up to 50 jobs/month",
        "1 technician",
        "Basic job tracking",
        "Customer notifications",
        "Branded invoices",
      ],

      // buttonText: "Get Started",
      // buttonClass:
      //   "bg-zinc-300 shadow-[0px_1px_1px_-0.5px_rgba(16,24,40,0.20)] outline outline-0.5 outline-[#1e29391f] outline-offset-[-0.5px] text-gray-800 text-shadow-[0px_1px_1px_rgba(16,24,40,0.08)] hover:bg-zinc-400",

      button: "Coming Soon",
    },
    {
      name: "Pro",
      monthlyPrice: "Coming Soon",
      annualPrice: "Coming Soon",
      description: "Ideal for growing repair shops.",
      features: [
        "Unlimited jobs",
        "Up to 5 technicians",
        "Digital vehicle inspections",
        "Priority support",
        "Customer approval portal",
        "Advanced analytics",
      ],
      popular: true,
      button: "Coming Soon",
    },
    {
      name: "Enterprise",
      monthlyPrice: "Custom",
      annualPrice: "Custom",
      description: "For multi-location operations.",
      features: [
        "Multi-location support",
        "Unlimited technicians",
        "API access",
        "Custom integrations",
        "Dedicated support",
        "Custom branding",
      ],
      button: "Contact Sales",
    },
  ];

  return (
    <section className="relative w-full py-24 px-6 overflow-hidden">
      {/* background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-pricing-bg blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Pricing built for
            <span className="text-pricing-foreground"> every shop</span>
          </h1>

          <p className="mt-4 text-muted-foreground text-lg">
            From single-bay garages to multi-location operations.
          </p>

          {/* toggle */}
          <div className="flex justify-center mt-8">
            <div className="bg-muted p-1 rounded-lg flex gap-1">
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition
                ${isAnnual ? "bg-background shadow" : "text-muted-foreground"}`}
              >
                Annual
              </button>

              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition
                ${!isAnnual ? "bg-background shadow" : "text-muted-foreground"}`}
              >
                Monthly
              </button>
            </div>

            <span className="text-green-500 text-sm ml-3 font-medium">
              Save 20%
            </span>
          </div>
        </div>

        {/* pricing cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-8 flex flex-col justify-between
              transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl
              ${
                plan.popular
                  ? "bg-pricing-card text-white scale-105 shadow-xl"
                  : "bg-zinc-900/40 backdrop-blur border border-zinc-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 text-xs font-semibold bg-white text-black px-2 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>

                {/* price */}
                <div className="flex items-end mt-4 gap-1">
                  <div className="text-5xl font-bold tracking-tight">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </div>

                  {plan.monthlyPrice !== "Custom" && (
                    <span className="text-sm opacity-70 mb-1">/month</span>
                  )}
                </div>

                <p className="text-sm opacity-80 mt-3">{plan.description}</p>

                {/* button */}
                <Button
                  className={`w-full mt-6 rounded-full font-semibold cursor-pointer
                  ${
                    plan.popular
                      ? "bg-white text-pricing-card hover:bg-gray-100"
                      : "bg-pricing-button text-white hover:bg-pricing-card"
                  }`}
                >
                  {plan.button}
                </Button>

                {/* features */}
                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className={`flex items-center justify-center w-5 h-5 rounded-full
                        ${plan.popular ? "bg-white/20" : "bg-pricing-button/20"}`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>

                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}