"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

//TODO: Update the faq data to a realsonable data
const faqData = [
  {
    question: "What is Wrench Cloud?",
    answer:
      "Wrench Cloud is garage management software designed for auto repair shops of all sizes. Whether you're a single-bay operation or managing multiple locations, it helps you streamline job tracking, customer communication, and shop operations.",
  },
  {
    question: "How do Digital Vehicle Inspections work?",
    answer:
      "Our DVI feature lets technicians capture photos and notes during inspections directly from their phone or tablet. Customers receive a professional report with images showing exactly what needs attention, building trust and increasing approved repairs.",
  },
  {
    question: "Can I import my existing customer data?",
    answer:
      "Yes! We offer easy data import from spreadsheets and many popular garage management systems. Our support team can also help with custom migrations for larger operations.",
  },
  {
    question: "What's included in the free plan?",
    answer:
      "The free plan includes up to 50 jobs per month, 1 technician, basic job tracking, customer notifications, and invoicing with Wrench Cloud branding. It's perfect for small shops or those wanting to try the platform before upgrading.",
  },
  {
    question: "Do you offer multi-shop support?",
    answer:
      "Absolutely! Our Enterprise plan includes full multi-location support, allowing you to manage all your shops from a single dashboard while maintaining separate reporting and team management for each location.",
  },
  {
    question: "Is my shop data secure?",
    answer:
      "Security is our top priority. We use enterprise-grade encryption, secure cloud infrastructure, and regular backups to protect your data. Your customer information and business data are safe with us.",
  },
]

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

const FAQItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => {
  return (
    <div
      onClick={onToggle}
      className={`
      group relative w-full cursor-pointer
      rounded-xl border border-border
      bg-card/80 backdrop-blur
      shadow-sm hover:shadow-md
      transition-all duration-300
      overflow-hidden
      ${isOpen ? "ring-1 ring-primary/40 shadow-md" : ""}
      `}
    >
      {/* accent strip */}
      <div
        className={`
        absolute left-0 top-0 h-full w-[3px]
        bg-primary transition-all duration-300
        ${isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-60"}
        `}
      />

      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <h3 className="text-base font-semibold text-foreground leading-6">
          {question}
        </h3>

        <ChevronDown
          className={`
          w-5 h-5 shrink-0
          transition-all duration-300
          ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground"}
          `}
        />
      </div>

      <div
        className={`
        grid transition-all duration-300 ease-in-out
        ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
        `}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }
  return (
    <section className="relative w-full px-6 py-24 flex flex-col items-center overflow-hidden">

  {/* background glow */}
  <div className="pointer-events-none absolute top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 blur-[140px]" />

  <div className="relative z-10 max-w-4xl text-center mb-16 space-y-4">
    <h2 className="text-5xl md:text-6xl mb-5 font-bold tracking-tight">
      Frequently Asked Questions
    </h2>

    <p className="mt-4 w-[80%] text-muted-foreground text-lg mx-auto">
      Everything you need to know about Wrench Cloud and how it can help you run your shop more efficiently.
    </p>
  </div>

  <div className="relative text-lg z-10 w-full max-w-2xl flex flex-col gap-4">
    {faqData.map((faq, index) => (
      <FAQItem
        key={index}
        {...faq}
        isOpen={openIndex === index}
        onToggle={() => toggleItem(index)}
      />
    ))}
  </div>
</section>
  )
}
