"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useInView,
  useTransform,
  AnimatePresence,
} from "framer-motion"
import type { Transition } from "framer-motion"
import {
  ArrowRight,
  ArrowDown,
  Wrench,
  ClipboardList,
  FileText,
  Users,
  Package,
  UserCheck,
  BarChart3,
  Clock,
  Phone,
  Shield,
  CheckCircle,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react"
import { CallbackForm } from "./callback-form"

/* ================================================================
   THEME CONTEXT
   ─────────────────
   "Liquid and Weighty" — the toggle between light and dark feels
   like the dimming of lights in a premium showroom. Smooth,
   deliberate, never jarring.
   ================================================================ */

type Theme = "light" | "dark"

const ThemeContext = React.createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: "dark", toggle: () => {} })

function useTheme() {
  return React.useContext(ThemeContext)
}

/* ================================================================
   ANIMATION PRESETS
   ─────────────────
   "Liquid and Weighty." Every motion carries the heft of
   precision machinery — the silent, solid thud of a high-end
   car door, the satisfying turn of a perfectly tuned engine key.
   ================================================================ */

/** Heavy, deliberate — like the weighty close of a luxury car door */
const doorClose: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 30,
  mass: 1.2,
}

/** Precision click — a ratchet's confident engagement */
const precisionClick: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.6,
}

/** Editorial reveal — unhurried, authoritative, no bounce */
const editorialReveal = {
  duration: 0.8,
  ease: [0.22, 1, 0.36, 1] as const,
}

/** Showroom dimmer — the smooth transition of premium lighting */
const showroomDim = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1] as const,
}

/* ================================================================
   THEME CLASSES
   ─────────────────
   Dual-optimized: creamy paper-like light mode and
   deep midnight-ink dark mode.
   ================================================================ */

const themeStyles = {
  light: {
    bg: "bg-[#f5f0e8]",
    text: "text-[#1a1a18]",
    textMuted: "text-[#1a1a18]/55",
    textSubtle: "text-[#1a1a18]/35",
    border: "border-[#1a1a18]/10",
    borderAccent: "border-[#1a1a18]/6",
    cardBg: "bg-white",
    cardBgAlt: "bg-[#ebe5d9]",
    navBg: "bg-[#f5f0e8]/90",
    surface: "bg-[#ede8dd]",
    selection: "selection:bg-primary/20 selection:text-[#1a1a18]",
    gridOpacity: "opacity-[0.04]",
    gridColor: "#1a1a18",
  },
  dark: {
    bg: "bg-[#0c0e12]",
    text: "text-[#e8e4dc]",
    textMuted: "text-[#e8e4dc]/55",
    textSubtle: "text-[#e8e4dc]/30",
    border: "border-white/8",
    borderAccent: "border-white/5",
    cardBg: "bg-[#13151a]",
    cardBgAlt: "bg-[#181b22]",
    navBg: "bg-[#0c0e12]/90",
    surface: "bg-[#111318]",
    selection: "selection:bg-primary/30 selection:text-white",
    gridOpacity: "opacity-[0.025]",
    gridColor: "#ffffff",
  },
} as const

/* ================================================================
   PRIMITIVES
   ================================================================ */

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...editorialReveal, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Editorial divider — a heavy horizontal rule with a center diamond */
function LedgerRule() {
  const { theme } = useTheme()
  const t = themeStyles[theme]
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-16 py-1">
      <div className={`relative h-px ${theme === "dark" ? "bg-white/6" : "bg-[#1a1a18]/8"}`}>
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${
            theme === "dark" ? "border border-white/15 bg-[#0c0e12]" : "border border-[#1a1a18]/15 bg-[#f5f0e8]"
          }`}
        />
      </div>
    </div>
  )
}

function Counter({
  value,
  suffix = "",
}: {
  value: number
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const duration = 1600
    const startTime = Date.now()
    let rafId: number

    const tick = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(eased * value))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isInView, value])

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  )
}

/* ================================================================
   NAVIGATION
   ─────────────────
   Frosted glass header — a polished concrete lintel. The logo
   carries the weight of a precision instrument's nameplate.
   ================================================================ */

function Navigation() {
  const { theme, toggle } = useTheme()
  const t = themeStyles[theme]
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 50))

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? `${t.navBg} backdrop-blur-xl ${t.border} border-b shadow-sm`
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-16 h-16 md:h-20 flex items-center justify-between">
        {/* Logo — precision nameplate */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm border border-primary/40 bg-primary/10 flex items-center justify-center">
            <Wrench className="w-4.5 h-4.5 text-primary" />
          </div>
          <span
            className={`font-serif text-lg tracking-tight font-semibold ${
              theme === "dark" ? "text-white" : "text-[#1a1a18]"
            }`}
          >
            WrenchCloud
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10">
          {[
            { id: "features", label: "Features" },
            { id: "how-it-works", label: "How It Works" },
            { id: "results", label: "Results" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`font-sans text-[13px] tracking-wide uppercase ${t.textMuted} hover:text-primary transition-colors duration-300`}
            >
              {item.label}
            </button>
          ))}
          <Link
            href="/login"
            className={`font-sans text-[13px] tracking-wide uppercase ${t.textSubtle} hover:text-primary transition-colors duration-300`}
          >
            Log In
          </Link>
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme toggle — showroom dimmer */}
          <motion.button
            onClick={toggle}
            whileTap={{ scale: 0.92 }}
            className={`p-2.5 rounded-sm ${t.border} border hover:border-primary/30 transition-colors duration-300`}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={showroomDim}
                >
                  <Sun className={`w-4 h-4 ${t.textMuted}`} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={showroomDim}
                >
                  <Moon className={`w-4 h-4 ${t.textMuted}`} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <CallbackForm
            trigger={
              <button className="px-5 py-2.5 bg-primary text-black font-sans text-[13px] font-semibold tracking-wide uppercase rounded-sm hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
                Request a Demo
              </button>
            }
          />
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          <motion.button
            onClick={toggle}
            whileTap={{ scale: 0.92 }}
            className={`p-2 ${t.textMuted}`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </motion.button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`${t.textMuted} p-2`}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={showroomDim}
            className={`md:hidden ${t.navBg} backdrop-blur-xl ${t.border} border-b px-6 py-6 space-y-4 overflow-hidden`}
          >
            {[
              { id: "features", label: "Features" },
              { id: "how-it-works", label: "How It Works" },
              { id: "results", label: "Results" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`block font-sans text-base ${t.textMuted} hover:text-primary`}
              >
                {item.label}
              </button>
            ))}
            <Link
              href="/login"
              className={`block font-sans text-base ${t.textSubtle} hover:text-primary`}
            >
              Log In
            </Link>
            <CallbackForm
              trigger={
                <button className="mt-2 w-full px-5 py-2.5 bg-primary text-black font-sans text-sm font-semibold rounded-sm">
                  Request a Demo
                </button>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

/* ================================================================
   HERO
   ─────────────────
   "Run Your Shop. Not Your Paperwork."
   
   A high-ceilinged editorial spread. The headline has the
   commanding weight of a masthead — stamped-in-steel authority.
   The live status panel glows like an instrument cluster.
   ================================================================ */

function HeroSection() {
  const { theme } = useTheme()
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

/* ================================================================
   PROBLEM SECTION — "Sound Familiar?"
   ─────────────────
   The Heavy Burden. Each pain point is a ledger entry — the chaos
   of the paper trail laid bare like an open logbook.
   ================================================================ */

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

function ProblemSection() {
  const { theme } = useTheme()
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

/* ================================================================
   FEATURES — "Every Tool in Its Place"
   ─────────────────
   The Shadow Board — arranged like a premium editorial grid.
   Each feature card is a page from an architectural journal:
   generous whitespace, confident typography, and a live-status
   emerald accent that signals capability.
   ================================================================ */

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

function FeaturesSection() {
  const { theme } = useTheme()
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

/* ================================================================
   HOW IT WORKS
   ─────────────────
   "Up and Running Before Your Next Oil Change."
   Three precise steps — like the markings on a precision torque
   wrench. Each step is a clear station in the process.
   ================================================================ */

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

function HowItWorksSection() {
  const { theme } = useTheme()
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

/* ================================================================
   RESULTS & SOCIAL PROOF
   ─────────────────
   "The Numbers Speak Plain."
   Hard facts displayed like precision instrument readings.
   The testimonial is set like a pull-quote in a premium editorial.
   ================================================================ */

const stats = [
  { value: 47, suffix: "%", label: "Less time on paperwork" },
  { value: 3, suffix: "\u00d7", label: "Faster estimate turnaround" },
  { value: 0, suffix: "", label: "Lost invoices per month", display: "Zero" },
]

function ResultsSection() {
  const { theme } = useTheme()
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

/* ================================================================
   CTA — "The Satisfying Turn of the Key"
   ─────────────────
   The emotional climax. All burden lifted. The engine starts.
   Low-risk, transparent — a firm handshake from a trusted
   craftsman, not a high-pressure sales pitch.
   ================================================================ */

function CTASection() {
  const { theme } = useTheme()
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

/* ================================================================
   FOOTER
   ─────────────────
   Quiet authority. The final page of the ledger.
   ================================================================ */

function Footer() {
  const { theme } = useTheme()
  const t = themeStyles[theme]

  return (
    <footer className={`py-12 border-t ${t.border}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className={`flex items-center gap-3 ${t.textSubtle}`}>
          <Wrench className="w-3.5 h-3.5" />
          <span className="font-sans text-sm">
            WrenchCloud &copy; {new Date().getFullYear()}
          </span>
        </div>
        <div className={`flex gap-8 font-sans text-sm ${t.textSubtle}`}>
          <a
            href="#"
            className="hover:text-primary transition-colors duration-300"
          >
            Privacy
          </a>
          <a
            href="#"
            className="hover:text-primary transition-colors duration-300"
          >
            Terms
          </a>
          <a
            href="mailto:hello@wrenchcloud.com"
            className="hover:text-primary transition-colors duration-300"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}

/* ================================================================
   MAIN EXPORT — "The Master Mechanic's Digital Ledger"
   ─────────────────
   Metropolitan design: the complete editorial journey from
   Heavy Burden → Weightless Clarity.
   
   Visual arc: Chaos → Recognition → Organization → Proof → Resolution
   
   The smooth transition between light and dark themes feels like
   the dimming of lights in a premium showroom — liquid and weighty.
   ================================================================ */

export function MetropolitanLanding() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<Theme>("dark")

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const t = themeStyles[theme]

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div
        className={`min-h-screen transition-colors duration-700 ease-out ${t.bg} ${t.text} ${t.selection} overflow-x-hidden`}
      >
        {/* Architectural grid — polished concrete floor pattern */}
        <div
          className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-700 ${t.gridOpacity}`}
          style={{
            backgroundImage: `
              linear-gradient(to right, ${t.gridColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${t.gridColor} 1px, transparent 1px)
            `,
            backgroundSize: "6rem 6rem",
          }}
        />

        {/* Subtle paper texture in light mode */}
        {theme === "light" && (
          <div
            className="fixed inset-0 z-0 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />
        )}

        <div className="relative z-10">
          <Navigation />
          <HeroSection />
          <LedgerRule />
          <ProblemSection />
          <LedgerRule />
          <FeaturesSection />
          <LedgerRule />
          <HowItWorksSection />
          <LedgerRule />
          <ResultsSection />
          <LedgerRule />
          <CTASection />
          <Footer />
        </div>
      </div>
    </ThemeContext.Provider>
  )
}
