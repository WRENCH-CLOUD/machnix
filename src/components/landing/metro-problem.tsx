"use client"

import { motion } from "framer-motion"
import { Clock, FileText, Package, Users } from "lucide-react"
import { useMetroTheme, themeStyles, Reveal, precisionClick } from "./metro-theme"

const problems = [
  {
    icon: <Clock className="w-5 h-5" />,
    text: "Hours lost to handwritten job cards every single week",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    text: "Invoices that never make it to the customer on time",
  },
  {
    icon: <Package className="w-5 h-5" />,
    text: "Parts inventory that\u2019s pure guesswork until something runs out",
  },
  {
    icon: <Users className="w-5 h-5" />,
    text: "Customer follow-ups that fall through the cracks every day",
  },
]

export function ProblemSection() {
  const { theme } = useMetroTheme()
  const t = themeStyles[theme]

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <Reveal>
          <div className="text-center mb-20">
            <span className="font-mono text-xs text-primary/80 uppercase tracking-[0.25em] mb-5 block">
              The Daily Grind
            </span>
            <h2
              className={`font-serif text-3xl md:text-4xl lg:text-[3.25rem] tracking-tight leading-tight ${
                theme === "dark" ? "text-white" : "text-[#1a1a18]"
              }`}
            >
              Sound Familiar?
            </h2>
          </div>
        </Reveal>

        {/* Ledger entries — each problem is a weighted row */}
        <div className="max-w-3xl mx-auto space-y-0">
          {problems.map((p, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <motion.div
                whileHover={{ x: 8 }}
                transition={precisionClick}
                className={`flex items-start gap-6 py-7 border-b ${t.borderAccent} cursor-default group`}
              >
                <div
                  className={`shrink-0 mt-0.5 p-3 rounded-sm ${
                    theme === "dark"
                      ? "bg-white/4 text-white/30 group-hover:text-primary group-hover:bg-primary/8"
                      : "bg-[#1a1a18]/4 text-[#1a1a18]/30 group-hover:text-primary group-hover:bg-primary/8"
                  } transition-all duration-300`}
                >
                  {p.icon}
                </div>
                <div>
                  <p className={`font-sans text-base md:text-lg leading-relaxed ${t.textMuted} group-hover:${theme === "dark" ? "text-white/80" : "text-[#1a1a18]/80"} transition-colors duration-300`}>
                    {p.text}
                  </p>
                </div>
                <span className={`shrink-0 font-mono text-[10px] ${t.textSubtle} mt-2`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.5}>
          <p className={`text-center mt-14 font-sans text-sm max-w-md mx-auto ${t.textSubtle}`}>
            You didn&apos;t open a shop to spend half your day on paperwork.
            There&apos;s a better way.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
