"use client"

import { useState, useEffect, useCallback } from "react"
import { ThemeContext, themeStyles, LedgerRule } from "@/components/landing/metro-theme"
import { Navigation } from "@/components/landing/metro-navigation"
import { HeroSection } from "@/components/landing/metro-hero"
import { ProblemSection } from "@/components/landing/metro-problem"
import { FeaturesSection } from "@/components/landing/metro-features"
import { HowItWorksSection } from "@/components/landing/metro-how-it-works"
import { ResultsSection } from "@/components/landing/metro-results"
import { CTASection } from "@/components/landing/metro-cta"
import { FooterSection } from "@/components/landing/metro-footer"
import type { Theme } from "@/components/landing/metro-theme"

export default function HomePage() {
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
        {/* Architectural grid */}
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

        {/* Paper texture in light mode */}
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
          <FooterSection />
        </div>
      </div>
    </ThemeContext.Provider>
  )
}
