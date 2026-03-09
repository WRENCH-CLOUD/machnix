"use client"

import { ArrowRight } from "lucide-react"
import { useMetroTheme, themeStyles, Reveal } from "./metro-theme"

const steps = [
  {
    num: "01",
    title: "Set up your shop",
    desc: "Add your business details, services, and pricing. The whole setup takes about as long as a routine oil change.",
  },
  {
    num: "02",
    title: "Bring your team on board",
    desc: "Invite your mechanics and front desk. Assign roles so everyone sees exactly what they need \u2014 nothing more, nothing less.",
  },
  {
    num: "03",
    title: "Start running jobs",
    desc: "Create your first digital job card and watch everything fall into place. Estimates, invoices, customer updates \u2014 all from one source.",
  },
]

export function HowItWorksSection() {
  const { theme } = useMetroTheme()
  const t = themeStyles[theme]

  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <Reveal>
          <div className="text-center mb-24">
            <span className="font-mono text-xs text-primary/80 uppercase tracking-[0.25em] mb-5 block">
              Getting Started
            </span>
            <h2
              className={`font-serif text-3xl md:text-4xl lg:text-[3.25rem] tracking-tight leading-tight ${
                theme === "dark" ? "text-white" : "text-[#1a1a18]"
              }`}
            >
              Up and Running Before Your{" "}
              <br className="hidden md:block" />
              Next Oil Change.
            </h2>
          </div>
        </Reveal>

        {/* Steps — precision gauge markings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.15}>
              <div className="relative p-10 md:p-12">
                {/* Connector line */}
                {i < 2 && (
                  <div
                    className={`hidden md:block absolute right-0 top-1/4 bottom-1/4 w-px ${
                      theme === "dark" ? "bg-white/8" : "bg-[#1a1a18]/8"
                    }`}
                  />
                )}

                {/* Step number — large, editorial */}
                <div className="mb-8 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-sm border-2 border-primary/30 bg-primary/8 flex items-center justify-center">
                    <span className="font-mono text-lg text-primary font-bold">
                      {step.num}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:flex flex-1 items-center">
                      <div className={`flex-1 h-px ${theme === "dark" ? "bg-white/6" : "bg-[#1a1a18]/6"}`} />
                      <ArrowRight className={`w-3.5 h-3.5 ${t.textSubtle}`} />
                    </div>
                  )}
                </div>

                <h3
                  className={`font-serif text-xl md:text-2xl mb-4 tracking-tight ${
                    theme === "dark" ? "text-white" : "text-[#1a1a18]"
                  }`}
                >
                  {step.title}
                </h3>
                <p className={`font-sans text-sm leading-relaxed ${t.textMuted}`}>
                  {step.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
