"use client"

import { useMetroTheme, themeStyles, Reveal, Counter } from "./metro-theme"

const stats = [
  { value: 47, suffix: "%", label: "Less time on paperwork" },
  { value: 3, suffix: "\u00d7", label: "Faster estimate turnaround" },
  { value: 0, suffix: "", label: "Lost invoices per month", display: "Zero" },
]

export function ResultsSection() {
  const { theme } = useMetroTheme()
  const t = themeStyles[theme]

  return (
    <section id="results" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <Reveal>
          <div className="text-center mb-20">
            <span className="font-mono text-xs text-primary/80 uppercase tracking-[0.25em] mb-5 block">
              Results
            </span>
            <h2
              className={`font-serif text-3xl md:text-4xl lg:text-[3.25rem] tracking-tight leading-tight ${
                theme === "dark" ? "text-white" : "text-[#1a1a18]"
              }`}
            >
              The Numbers Speak Plain.
            </h2>
          </div>
        </Reveal>

        {/* Stats — instrument readings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-24">
          {stats.map((stat, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div
                className={`rounded-sm p-10 md:p-14 text-center border ${t.border} ${t.cardBg} relative overflow-hidden`}
              >
                {/* Subtle top accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="font-serif text-5xl md:text-6xl text-primary mb-4 tracking-tight">
                  {stat.display ?? (
                    <Counter value={stat.value} suffix={stat.suffix} />
                  )}
                </div>
                <div className={`font-sans text-sm ${t.textMuted}`}>
                  {stat.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Testimonial — editorial pull-quote */}
        <Reveal>
          <div
            className={`max-w-3xl mx-auto text-center rounded-sm p-12 md:p-16 ${t.cardBgAlt} border ${t.borderAccent}`}
          >
            <div className="font-serif text-6xl text-primary/20 mb-4 leading-none select-none">
              &ldquo;
            </div>
            <blockquote
              className={`font-serif text-xl md:text-2xl leading-relaxed mb-8 italic ${
                theme === "dark" ? "text-white/80" : "text-[#1a1a18]/80"
              }`}
            >
              After 22 years of carbon-copy job cards, I didn&apos;t
              think I needed software. WrenchCloud changed my mind in the first
              week. It&apos;s not flashy &mdash; it just works.
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="font-serif text-sm text-primary font-bold">RK</span>
              </div>
              <div className="text-left">
                <div
                  className={`font-sans text-sm font-medium ${
                    theme === "dark" ? "text-white/70" : "text-[#1a1a18]/70"
                  }`}
                >
                  Rajesh K.
                </div>
                <div className={`font-sans text-xs ${t.textSubtle}`}>
                  Owner, Premier Auto Garage
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
