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
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onToggle()
  }
  return (
    <div
      className={`w-full bg-[rgba(231,236,235,0.08)] shadow-[0px_2px_4px_rgba(0,0,0,0.16)] overflow-hidden rounded-[10px] outline outline-1 outline-border outline-offset-[-1px] transition-all duration-500 ease-out cursor-pointer`}
      onClick={handleClick}
    >
      <div className="w-full px-5 py-[18px] pr-4 flex justify-between items-center gap-5 text-left transition-all duration-300 ease-out">
        <div className="flex-1 text-foreground text-base font-medium leading-6 warp-break-words">{question}</div>
        <div className="flex justify-center items-center">
          <ChevronDown
            className={`w-6 h-6 text-muted-foreground-dark transition-all duration-500 ease-out ${isOpen ? "rotate-180 scale-110" : "rotate-0 scale-100"}`}
          />
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
        style={{
          transitionProperty: "max-height, opacity, padding",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className={`px-5 transition-all duration-500 ease-out ${isOpen ? "pb-[18px] pt-2 translate-y-0" : "pb-0 pt-0 -translate-y-2"}`}
        >
          <div className="text-foreground/80 text-sm font-normal leading-6 warp-break-words">{answer}</div>
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
    <section className="w-full pt-[66px] pb-20 md:pb-40 px-5 relative flex flex-col justify-center items-center overflow-hidden">
      <div
        className="pointer-events-none w-[240px] sm:w-[300px] h-[380px] sm:h-[500px] absolute top-[150px] left-1/2 -translate-x-1/2 origin-top-left rotate-[-33.39deg] bg-primary/5 sm:bg-primary/10 blur-[70px] sm:blur-[100px] z-0"
        aria-hidden="true"
      />
      <div className="self-stretch pt-8 pb-8 md:pt-14 md:pb-14 flex flex-col justify-center items-center gap-2 relative z-10">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="w-full max-w-[435px] text-center text-foreground text-4xl font-semibold leading-10 warp-break-words">
            Frequently Asked Questions
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-[18.20px] warp-break-words">
            Everything you need to know about Wrench Cloud and how it can transform your shop
          </p>
        </div>
      </div>
      <div className="w-full max-w-[600px] pt-0.5 pb-10 flex flex-col justify-start items-start gap-4 relative z-10">
        {faqData.map((faq, index) => (
          <FAQItem key={index} {...faq} isOpen={openIndex === index} onToggle={() => toggleItem(index)} />
        ))}
      </div>
    </section>
  )
}
