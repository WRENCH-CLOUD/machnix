"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import type { Transition } from "framer-motion"

/* ================================================================
   THEME TYPES & CONTEXT
   ─────────────────
   "Liquid and Weighty" — the toggle between light and dark feels
   like the dimming of lights in a premium showroom.
   ================================================================ */

export type Theme = "light" | "dark"

export const ThemeContext = React.createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: "dark", toggle: () => {} })

export function useMetroTheme() {
  return React.useContext(ThemeContext)
}

/* ================================================================
   ANIMATION PRESETS
   ================================================================ */

/** Heavy, deliberate — like the weighty close of a luxury car door */
export const doorClose: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 30,
  mass: 1.2,
}

/** Precision click — a ratchet's confident engagement */
export const precisionClick: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.6,
}

/** Editorial reveal — unhurried, authoritative, no bounce */
export const editorialReveal = {
  duration: 0.8,
  ease: [0.22, 1, 0.36, 1] as const,
}

/** Showroom dimmer — the smooth transition of premium lighting */
export const showroomDim = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1] as const,
}

/* ================================================================
   THEME STYLES
   ─────────────────
   Dual-optimized: creamy paper-like light mode and
   deep midnight-ink dark mode.
   ================================================================ */

export const themeStyles = {
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
   SHARED PRIMITIVES
   ================================================================ */

export function Reveal({
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
export function LedgerRule() {
  const { theme } = useMetroTheme()
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

export function Counter({
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
