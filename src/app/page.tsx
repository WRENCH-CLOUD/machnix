"use client";

import { useState, useEffect } from "react";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import AIDemo from "@/components/landing/AiDemo";
import ValueProp from "@/components/landing/ValueProp";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

// --- Colors & Theme (Mapped from Tailwind Config) ---
// Black: #050505
// Dark: #0f0f0f
// Card: #18181b
// Green: #22c55e
// GreenDark: #15803d
// Accent: #4ade80

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll listener for glass nav
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#22c55e] selection:text-black scroll-smooth">
      <Navbar
        isScrolled={isScrolled}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <Hero />
      <Features />
      <AIDemo />
      <ValueProp />
      <CTA />
      <Footer />
    </div>
  );
}

// --- Components ---
