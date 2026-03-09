"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion"
import { Wrench, Menu, X, Sun, Moon } from "lucide-react"
import { CallbackForm } from "./callback-form"
import { useMetroTheme, themeStyles, showroomDim } from "./metro-theme"

export function Navigation() {
  const { theme, toggle } = useMetroTheme()
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
