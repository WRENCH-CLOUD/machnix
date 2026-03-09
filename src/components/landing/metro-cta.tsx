"use client"

import { ArrowRight, Phone, Shield, CheckCircle } from "lucide-react"
import { CallbackForm } from "./callback-form"
import { useMetroTheme, themeStyles, Reveal } from "./metro-theme"

export function CTASection() {
  const { theme } = useMetroTheme()
  const t = themeStyles[theme]

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div
          className={`relative rounded-sm overflow-hidden border ${t.border} ${
            theme === "dark" ? "bg-gradient-to-br from-[#13151a] to-[#0c0e12]" : "bg-gradient-to-br from-white to-[#f5f0e8]"
          }`}
        >
          {/* Top accent — polished chrome strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="p-12 md:p-20 lg:p-28 text-center">
            <Reveal>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm border-2 border-primary/30 bg-primary/10 mb-10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h2
                className={`font-serif text-3xl md:text-4xl lg:text-[3.25rem] tracking-tight leading-tight mb-8 max-w-2xl mx-auto ${
                  theme === "dark" ? "text-white" : "text-[#1a1a18]"
                }`}
              >
                Your Shop Deserves a System{" "}
                <br className="hidden md:block" />
                as Reliable as Your Work.
              </h2>
            </Reveal>

            <Reveal delay={0.2}>
              <p className={`font-sans text-lg max-w-lg mx-auto mb-5 leading-relaxed ${t.textMuted}`}>
                Start with a free month. No contracts, no setup fees, no credit
                card. Just a straightforward tool for a straightforward business.
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <div
                className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-sans text-sm mb-12 ${t.textSubtle}`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary/60" /> Free
                  setup
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary/60" /> No
                  contracts
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary/60" />{" "}
                  Cancel anytime
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <CallbackForm
                  trigger={
                    <button className="group relative px-12 py-5 bg-primary text-black font-sans text-[15px] font-bold tracking-wide rounded-sm overflow-hidden transition-all duration-300 hover:shadow-[0_8px_50px_-10px] hover:shadow-primary/50">
                      <span className="relative z-10 flex items-center gap-3">
                        Start Managing Your Shop
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </span>
                    </button>
                  }
                />

                <CallbackForm
                  trigger={
                    <button
                      className={`flex items-center gap-3 px-8 py-5 font-sans text-[15px] transition-all duration-300 border rounded-sm ${t.border} hover:border-primary/30 ${t.textMuted} hover:text-primary`}
                    >
                      <Phone className="w-4 h-4" />
                      Request a Callback
                    </button>
                  }
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
