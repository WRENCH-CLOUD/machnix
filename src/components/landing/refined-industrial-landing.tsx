"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useInView,
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
} from "lucide-react"
import { CallbackForm } from "./callback-form"

/* ================================================================
   ANIMATION PRESETS
   ─────────────────
   "Oiled and precise." Every motion is purposeful — the smooth,
   weighted slide of a ball-bearing tool drawer, the satisfying
   click of a torque wrench reaching spec.
   ================================================================ */

/** Smooth, weighted — like a premium drawer sliding on bearings */
const drawerSlide: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 32,
  mass: 0.8,
}

/** Tight, immediate — the click of a ratchet engaging */
const torqueClick: Transition = {
  type: "spring",
  stiffness: 450,
  damping: 38,
  mass: 0.5,
}

/** Steady, confident fade — no bounce, no overshoot */
const steadyReveal = {
  duration: 0.6,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...steadyReveal, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function RuleLine() {
  return (
    <div className="max-w-300 mx-auto px-6 lg:px-12">
      <div className="h-px bg-white/8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border border-white/20" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border border-white/20" />
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
    const duration = 1400
    const startTime = Date.now()
    let rafId: number

    const tick = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
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
   Fixed, transparent initially → frosted glass on scroll.
   Structural. Confident. Never floaty.
   ================================================================ */

function Navigation() {
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0c08]/90 backdrop-blur-md border-b border-white/6"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-300 mx-auto px-6 lg:px-12 h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-primary/40 bg-primary/10 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          <span className="font-serif text-lg tracking-tight text-white">
            WrenchCloud
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { id: "features", label: "Features" },
            { id: "how-it-works", label: "How It Works" },
            { id: "results", label: "Results" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="font-sans text-sm text-white/50 hover:text-white transition-colors duration-200"
            >
              {item.label}
            </button>
          ))}
          <Link
            href="/login"
            className="font-sans text-sm text-white/40 hover:text-white/70 transition-colors duration-200"
          >
            Log In
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <CallbackForm
            trigger={
              <button className="px-5 py-2.5 bg-primary text-black font-sans text-sm font-medium tracking-wide hover:bg-primary/90 transition-colors duration-200">
                Request a Demo
              </button>
            }
          />
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white/70 p-2"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={torqueClick}
          className="md:hidden bg-[#0a0c08]/95 backdrop-blur-lg border-b border-white/6 px-6 py-6 space-y-4"
        >
          {[
            { id: "features", label: "Features" },
            { id: "how-it-works", label: "How It Works" },
            { id: "results", label: "Results" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="block font-sans text-base text-white/60 hover:text-white"
            >
              {item.label}
            </button>
          ))}
          <Link
            href="/login"
            className="block font-sans text-base text-white/40 hover:text-white/70"
          >
            Log In
          </Link>
          <CallbackForm
            trigger={
              <button className="mt-2 w-full px-5 py-2.5 bg-primary text-black font-sans text-sm font-medium">
                Request a Demo
              </button>
            }
          />
        </motion.div>
      )}
    </motion.header>
  )
}

/* ================================================================
   HERO
   ─────────────────
   "Run Your Shop. Not Your Paperwork."
   The emotional entry — immediate relief for the overworked owner.
   ================================================================ */

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Background accent gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-primary/3 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-[#0a0c08] to-transparent" />
      </div>

      <div className="max-w-300 mx-auto px-6 lg:px-12 relative z-10">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...torqueClick }}
          className="inline-flex items-center gap-2.5 mb-10"
        >
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </div>
          <span className="font-mono text-xs text-primary/90 uppercase tracking-[0.2em]">
            For Auto Repair Shops
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Main content */}
          <div className="lg:col-span-7">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ...steadyReveal }}
              className="font-serif text-[2.75rem] md:text-6xl lg:text-[4.25rem] leading-[1.08] tracking-tight text-white mb-8"
            >
              Run Your Shop.{" "}
              <br className="hidden sm:block" />
              <span className="text-white/50">Not Your Paperwork.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="font-sans text-lg md:text-xl text-white/55 leading-relaxed max-w-xl mb-12"
            >
              WrenchCloud replaces the paper job cards, misplaced invoices, and
              end-of-day headaches with one clear, reliable system. Built for
              garage owners who&apos;d rather turn wrenches than chase receipts.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...drawerSlide }}
              className="flex flex-col sm:flex-row gap-4 items-start"
            >
              <CallbackForm
                trigger={
                  <button className="group relative px-8 py-4 bg-primary text-black font-sans text-[15px] font-semibold tracking-wide overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_-5px] hover:shadow-primary/30">
                    <span className="relative z-10 flex items-center gap-2.5">
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
                className="flex items-center gap-2.5 px-6 py-4 text-white/50 hover:text-white font-sans text-[15px] transition-colors duration-200"
              >
                <Phone className="w-4 h-4" />
                See How It Works
              </button>
            </motion.div>
          </div>

          {/* Shop Status Panel — visual proof of value */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, ...drawerSlide }}
            className="lg:col-span-5 hidden lg:block"
          >
            <div className="border border-white/8 bg-white/2 backdrop-blur-sm p-8 h-full flex flex-col">
              <div className="font-mono text-[10px] text-white/60 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Shop Status Panel
              </div>

              <div className="space-y-6 grow">
                {[
                  {
                    label: "Active Jobs",
                    value: "12",
                    status: "tracking",
                  },
                  {
                    label: "Today\u2019s Revenue",
                    value: "\u20B947,200",
                    status: "recorded",
                  },
                  {
                    label: "Pending Estimates",
                    value: "3",
                    status: "queued",
                  },
                  {
                    label: "Parts Alerts",
                    value: "1 low stock",
                    status: "flagged",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1, ...torqueClick }}
                    className="flex justify-between items-center border-b border-white/5 pb-3"
                  >
                    <div>
                      <div className="font-sans text-sm text-white/70">
                        {item.label}
                      </div>
                      <div className="font-serif text-xl text-white mt-0.5">
                        {item.value}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-primary/60 uppercase">
                      {item.status}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 font-mono text-[10px] text-white/50 flex items-center gap-2">
                <div className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-70" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </div>
                All systems operational
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-20 md:mt-28 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "easeInOut",
            }}
            className="text-white/20"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* ================================================================
   PROBLEM SECTION — "Sound Familiar?"
   ─────────────────
   Empathy hook. The chaos of the paper trail.
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
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-300 mx-auto px-6 lg:px-12">
        <Reveal>
          <div className="text-center mb-16">
            <span className="font-mono text-xs text-primary/70 uppercase tracking-[0.2em] mb-4 block">
              The Daily Grind
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white tracking-tight">
              Sound Familiar?
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/6">
          {problems.map((p, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-[#0a0c08] p-8 h-full flex flex-col items-start gap-4 min-h-40">
                <div className="p-2.5 border border-white/10 text-white/40">
                  {p.icon}
                </div>
                <p className="font-sans text-white/60 text-[15px] leading-relaxed">
                  {p.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.4}>
          <p className="text-center mt-12 font-sans text-white/30 text-sm max-w-lg mx-auto">
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
   The shadow board. Every function in its exact position.
   Hover interactions feel like sliding a drawer open.
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
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="max-w-300 mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="flex flex-col md:flex-row justify-between items-baseline gap-8 mb-16">
          <Reveal>
            <div>
              <span className="font-mono text-xs text-primary/70 uppercase tracking-[0.2em] mb-4 block">
                Capabilities
              </span>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white tracking-tight">
                Every Tool in Its Place.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="font-sans text-white/40 text-sm max-w-sm md:text-right leading-relaxed border-l md:border-l-0 md:border-r border-primary/20 pl-4 md:pl-0 md:pr-4">
              Like a shadow board in a well-run shop &mdash; every function has
              its exact position. Nothing wasted. Nothing missing.
            </p>
          </Reveal>
        </div>

        {/* Shadow Board grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/6 border border-white/6">
          {features.map((f, i) => (
            <Reveal key={f.id} delay={i * 0.08}>
              <motion.div
                initial="idle"
                whileHover="hover"
                className="relative bg-[#0a0c08] p-8 md:p-10 h-full flex flex-col justify-between min-h-60 cursor-default group overflow-hidden"
              >
                {/* Top: icon + id */}
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2.5 border border-white/8 bg-white/2 text-white/40 group-hover:text-primary group-hover:border-primary/20 transition-colors duration-300">
                    {f.icon}
                  </div>
                  <span className="font-mono text-xs text-white/15 group-hover:text-primary/30 transition-colors duration-300">
                    {f.id}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-serif text-xl text-white mb-3 tracking-tight">
                    {f.title}
                  </h3>
                  <p className="font-sans text-sm text-white/45 leading-relaxed">
                    {f.desc}
                  </p>
                </div>

                {/* Drawer-slide accent line */}
                <motion.div
                  variants={{
                    idle: { scaleX: 0 },
                    hover: { scaleX: 1 },
                  }}
                  transition={drawerSlide}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left"
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
   Three clean steps. No anxiety. No friction.
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
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="max-w-300 mx-auto px-6 lg:px-12">
        <Reveal>
          <div className="text-center mb-20">
            <span className="font-mono text-xs text-primary/70 uppercase tracking-[0.2em] mb-4 block">
              Getting Started
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white tracking-tight">
              Up and Running Before Your{" "}
              <br className="hidden md:block" />
              Next Oil Change.
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px">
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.15}>
              <div className="relative p-8 md:p-10">
                {/* Large background number */}
                <div className="font-serif text-6xl md:text-7xl text-primary/[0.07] absolute top-4 right-6 select-none pointer-events-none">
                  {step.num}
                </div>

                {/* Vertical connector */}
                {i < 2 && (
                  <div className="hidden md:block absolute right-0 top-1/2 w-px h-16 -translate-y-1/2 bg-white/8" />
                )}

                <div className="relative z-10">
                  <div className="w-10 h-10 border border-primary/30 bg-primary/10 flex items-center justify-center mb-6">
                    <span className="font-mono text-sm text-primary font-medium">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl text-white mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="font-sans text-sm text-white/45 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
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
   Hard facts. One real testimonial. No fluff.
   ================================================================ */

const stats = [
  { value: 47, suffix: "%", label: "Less time on paperwork" },
  { value: 3, suffix: "\u00d7", label: "Faster estimate turnaround" },
  { value: 0, suffix: "", label: "Lost invoices per month", display: "Zero" },
]

function ResultsSection() {
  return (
    <section id="results" className="py-20 md:py-28">
      <div className="max-w-300 mx-auto px-6 lg:px-12">
        <Reveal>
          <div className="text-center mb-16">
            <span className="font-mono text-xs text-primary/70 uppercase tracking-[0.2em] mb-4 block">
              Results
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white tracking-tight">
              The Numbers Speak Plain.
            </h2>
          </div>
        </Reveal>

        {/* Stats strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/6 border border-white/6 mb-20">
          {stats.map((stat, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-[#0a0c08] p-10 md:p-12 text-center">
                <div className="font-serif text-5xl md:text-6xl text-primary mb-3">
                  {stat.display ?? (
                    <Counter value={stat.value} suffix={stat.suffix} />
                  )}
                </div>
                <div className="font-sans text-sm text-white/40">
                  {stat.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Testimonial */}
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-px bg-primary/40 mx-auto mb-8" />
            <blockquote className="font-serif text-xl md:text-2xl text-white/80 leading-relaxed mb-8 italic">
              &ldquo;After 22 years of carbon-copy job cards, I didn&apos;t
              think I needed software. WrenchCloud changed my mind in the first
              week. It&apos;s not flashy &mdash; it just works.&rdquo;
            </blockquote>
            <div className="font-sans text-sm text-white/40">
              <span className="text-white/60 font-medium">Rajesh K.</span>
              <span className="mx-2 text-white/20">&middot;</span>
              Owner, Premier Auto Garage
            </div>
            <div className="w-12 h-px bg-primary/40 mx-auto mt-8" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ================================================================
   CTA — "The Solid Handshake"
   ─────────────────
   Low-risk. Transparent. Feels like a firm handshake,
   not a high-pressure sales pitch.
   ================================================================ */

function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-300 mx-auto px-6 lg:px-12">
        <div className="border border-white/8 bg-white/1 backdrop-blur-sm relative overflow-hidden">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />

          <div className="p-12 md:p-20 lg:p-24 text-center">
            <Reveal>
              <div className="inline-flex items-center justify-center w-14 h-14 border border-primary/30 bg-primary/10 mb-8">
                <Shield className="w-5 h-5 text-primary" />
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white tracking-tight mb-6 max-w-2xl mx-auto">
                Your Shop Deserves a System{" "}
                <br className="hidden md:block" />
                as Reliable as Your Work.
              </h2>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="font-sans text-lg text-white/45 max-w-lg mx-auto mb-4 leading-relaxed">
                Start with a free month. No contracts, no setup fees, no credit
                card. Just a straightforward tool for a straightforward business.
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/25 font-sans text-sm mb-10">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-primary/50" /> Free
                  setup
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-primary/50" /> No
                  contracts
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-primary/50" />{" "}
                  Cancel anytime
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <CallbackForm
                  trigger={
                    <button className="group relative px-10 py-5 bg-primary text-black font-sans text-[15px] font-semibold tracking-wide overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_-8px] hover:shadow-primary/40">
                      <span className="relative z-10 flex items-center gap-2.5">
                        Start Managing Your Shop
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </span>
                    </button>
                  }
                />

                <CallbackForm
                  trigger={
                    <button className="flex items-center gap-2.5 px-6 py-5 text-white/40 hover:text-white font-sans text-[15px] transition-colors duration-200 border border-white/8 hover:border-white/15">
                      <Phone className="w-4 h-4" />
                      Request a Callback
                    </button>
                  }
                />
              </div>
            </Reveal>
          </div>

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   FOOTER
   ================================================================ */

function Footer() {
  return (
    <footer className="py-10 border-t border-white/6">
      <div className="max-w-300 mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 text-white/30">
          <Wrench className="w-3.5 h-3.5" />
          <span className="font-sans text-sm">
            WrenchCloud &copy; {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex gap-6 font-sans text-sm text-white/30">
          <a
            href="#"
            className="hover:text-white/60 transition-colors duration-200"
          >
            Privacy
          </a>
          <a
            href="#"
            className="hover:text-white/60 transition-colors duration-200"
          >
            Terms
          </a>
          <a
            href="mailto:hello@wrenchcloud.com"
            className="hover:text-white/60 transition-colors duration-200"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}

/* ================================================================
   MAIN EXPORT
   ─────────────────
   The complete single-page journey:
   Chaos → Recognition → Organization → Proof → Resolution
   ================================================================ */

export function RefinedIndustrialLanding() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0a0c08] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden">
      {/* Architectural blueprint grid */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "5rem 5rem",
        }}
      />

      <div className="relative z-10">
        <Navigation />
        <HeroSection />
        <RuleLine />
        <ProblemSection />
        <RuleLine />
        <FeaturesSection />
        <RuleLine />
        <HowItWorksSection />
        <RuleLine />
        <ResultsSection />
        <RuleLine />
        <CTASection />
        <Footer />
      </div>
    </div>
  )
}
