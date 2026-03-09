"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, ArrowDown, Phone, Shield } from "lucide-react"
import { CallbackForm } from "./callback-form"
import {
  useMetroTheme,
  themeStyles,
  editorialReveal,
  doorClose,
  precisionClick,
} from "./metro-theme"

export function HeroSection() {
  const { theme } = useMetroTheme()
  const t = themeStyles[theme]
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -40])

  return (
    <section className="relative pt-36 pb-24 md:pt-48 md:pb-36 overflow-hidden">
      {/* Ambient gradient — showroom lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[120px] ${
            theme === "dark" ? "bg-primary/4" : "bg-primary/6"
          }`}
        />
      </div>

      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10"
      >
        {/* Status badge — live signal beacon */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...precisionClick }}
          className="flex justify-center mb-12"
        >
          <div
            className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full ${
              theme === "dark"
                ? "bg-primary/8 border border-primary/15"
                : "bg-primary/6 border border-primary/12"
            }`}
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </div>
            <span className="font-mono text-xs text-primary uppercase tracking-[0.25em] font-medium">
              For Auto Repair Shops
            </span>
          </div>
        </motion.div>

        {/* Masthead headline — stamped-in-steel */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...editorialReveal }}
            className={`font-serif text-[2.75rem] md:text-6xl lg:text-[5rem] leading-[1.05] tracking-tight mb-8 ${
              theme === "dark" ? "text-white" : "text-[#1a1a18]"
            }`}
          >
            Run Your Shop.{" "}
            <br className="hidden sm:block" />
            <span className={t.textMuted}>Not Your Paperwork.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 1 }}
            className={`font-sans text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-14 ${t.textMuted}`}
          >
            WrenchCloud replaces the paper job cards, misplaced invoices, and
            end-of-day headaches with one clear, reliable system. Built for
            garage owners who&apos;d rather turn wrenches than chase receipts.
          </motion.p>

          {/* CTA cluster */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ...doorClose }}
            className="flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <CallbackForm
              trigger={
                <button className="group relative px-10 py-4.5 bg-primary text-black font-sans text-[15px] font-bold tracking-wide rounded-sm overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_-8px] hover:shadow-primary/40">
                  <span className="relative z-10 flex items-center gap-3">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                </button>
              }
            />

            <button
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className={`flex items-center gap-3 px-6 py-4.5 font-sans text-[15px] transition-colors duration-300 ${t.textMuted} hover:text-primary`}
            >
              <Phone className="w-4 h-4" />
              See How It Works
            </button>
          </motion.div>
        </div>

        {/* Shop Status Panel — precision instrument cluster */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, ...doorClose }}
          className="max-w-3xl mx-auto mt-20"
        >
          <div
            className={`rounded-sm overflow-hidden border ${t.border} ${t.cardBg} shadow-xl ${
              theme === "dark" ? "shadow-black/30" : "shadow-[#1a1a18]/8"
            }`}
          >
            {/* Header bar */}
            <div
              className={`px-8 py-4 border-b ${t.borderAccent} flex items-center justify-between`}
            >
              <div className={`font-mono text-[10px] uppercase tracking-[0.2em] ${t.textSubtle} flex items-center gap-2`}>
                <Shield className="w-3 h-3" />
                Shop Status Panel
              </div>
              <div className={`font-mono text-[10px] ${t.textSubtle} flex items-center gap-2`}>
                <div className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-70" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </div>
                All systems operational
              </div>
            </div>

            {/* Status grid */}
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                { label: "Active Jobs", value: "12", status: "tracking" },
                { label: "Today\u2019s Revenue", value: "\u20B947,200", status: "recorded" },
                { label: "Pending Estimates", value: "3", status: "queued" },
                { label: "Parts Alerts", value: "1 low stock", status: "flagged" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1, ...precisionClick }}
                  className={`p-6 md:p-8 ${i < 3 ? `border-r ${t.borderAccent}` : ""} ${
                    i < 2 ? `border-b md:border-b-0 ${t.borderAccent}` : ""
                  }`}
                >
                  <div className={`font-sans text-xs ${t.textSubtle} mb-2`}>
                    {item.label}
                  </div>
                  <div
                    className={`font-serif text-xl md:text-2xl ${
                      theme === "dark" ? "text-white" : "text-[#1a1a18]"
                    } mb-1`}
                  >
                    {item.value}
                  </div>
                  <span className="font-mono text-[9px] text-primary/70 uppercase tracking-widest">
                    {item.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="mt-20 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className={t.textSubtle}
          >
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
