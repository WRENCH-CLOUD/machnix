"use client"

import { motion } from "framer-motion"
import {
  ClipboardList,
  FileText,
  Users,
  Package,
  UserCheck,
  BarChart3,
} from "lucide-react"
import { useMetroTheme, themeStyles, Reveal, doorClose } from "./metro-theme"

const features = [
  {
    id: "01",
    icon: <ClipboardList className="w-5 h-5" />,
    title: "Job Tracking",
    desc: "Digital job cards with real-time status updates. No more walking across the floor to check on a vehicle.",
  },
  {
    id: "02",
    icon: <FileText className="w-5 h-5" />,
    title: "Estimates & Invoices",
    desc: "Professional estimates in minutes, not hours. Invoices that reach the customer and actually get paid.",
  },
  {
    id: "03",
    icon: <Users className="w-5 h-5" />,
    title: "Customer Records",
    desc: "Full service history and vehicle details at your fingertips. Everything you need before the customer even calls.",
  },
  {
    id: "04",
    icon: <Package className="w-5 h-5" />,
    title: "Parts Inventory",
    desc: "Know what\u2019s on the shelf and what needs ordering. No more surprise stockouts mid-repair.",
  },
  {
    id: "05",
    icon: <UserCheck className="w-5 h-5" />,
    title: "Team Management",
    desc: "Assign jobs to the right mechanic. See workload at a glance. Keep the shop floor moving smoothly.",
  },
  {
    id: "06",
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Reports & Dashboard",
    desc: "Your shop\u2019s numbers, laid out plain. Revenue, jobs completed, average time per repair \u2014 no MBA required.",
  },
]

export function FeaturesSection() {
  const { theme } = useMetroTheme()
  const t = themeStyles[theme]

  return (
    <section id="features" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        {/* Editorial section header — two-column spread */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mb-20">
          <Reveal>
            <div>
              <span className="font-mono text-xs text-primary/80 uppercase tracking-[0.25em] mb-5 block">
                Capabilities
              </span>
              <h2
                className={`font-serif text-3xl md:text-4xl lg:text-[3.25rem] tracking-tight leading-tight ${
                  theme === "dark" ? "text-white" : "text-[#1a1a18]"
                }`}
              >
                Every Tool in Its Place.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex items-end">
              <p
                className={`font-sans text-base leading-relaxed ${t.textMuted} border-l-2 border-primary/25 pl-6`}
              >
                Like a shadow board in a well-run shop &mdash; every function has
                its exact position. Nothing wasted. Nothing missing.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Feature cards — architectural journal grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Reveal key={f.id} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={doorClose}
                className={`relative rounded-sm p-8 md:p-10 h-full flex flex-col justify-between min-h-72 cursor-default group overflow-hidden border ${t.border} ${t.cardBg} transition-shadow duration-500 hover:shadow-xl ${
                  theme === "dark" ? "hover:shadow-primary/5" : "hover:shadow-primary/8"
                }`}
              >
                {/* Number watermark */}
                <div
                  className={`font-serif text-[5rem] leading-none absolute top-4 right-6 select-none pointer-events-none ${
                    theme === "dark" ? "text-white/[0.03]" : "text-[#1a1a18]/[0.04]"
                  } group-hover:text-primary/[0.08] transition-colors duration-500`}
                >
                  {f.id}
                </div>

                {/* Top: icon */}
                <div className="mb-8">
                  <div
                    className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-white/5 text-white/40 group-hover:bg-primary/10 group-hover:text-primary"
                        : "bg-[#1a1a18]/5 text-[#1a1a18]/40 group-hover:bg-primary/10 group-hover:text-primary"
                    }`}
                  >
                    {f.icon}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3
                    className={`font-serif text-xl mb-4 tracking-tight ${
                      theme === "dark" ? "text-white" : "text-[#1a1a18]"
                    }`}
                  >
                    {f.title}
                  </h3>
                  <p className={`font-sans text-sm leading-relaxed ${t.textMuted}`}>
                    {f.desc}
                  </p>
                </div>

                {/* Bottom accent — live status bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"
                />
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
