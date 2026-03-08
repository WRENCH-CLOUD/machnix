import React from "react"
import { Button } from "@/components/ui/button"
import { Header } from "./header"
import { CallbackForm } from "./callback-form"
import styles from "./hero-section.module.css"
import {
  ClipboardList,
  CalendarClock,
  MessageSquareText,
  LucideIcon,
} from "lucide-react"

type Card = {
  title: string
  desc: string
  icon: LucideIcon
}

const cards: Card[] = [
  {
    title: "Job Management",
    desc: "Track repairs from vehicle intake to delivery with real-time status updates. Monitor active jobs and technician progress easily.",
    icon: ClipboardList,
  },
  {
    title: "Smart Scheduling",
    desc: "Optimize technician schedules and workshop bays with intelligent scheduling. Plan services, avoid conflicts, and improve shop efficiency.",
    icon: MessageSquareText,
  },
  {
    title: "Customer Updates",
    desc: "Keep customers informed with live updates, service approvals, and instant invoice notifications.",
    icon: CalendarClock,
  },
]

export function HeroSection() {
  return (
    <section
      className="flex flex-col items-center text-center relative mx-auto rounded-2xl overflow-hidden my-6 py-0 px-4
         w-full min-h-[600px] md:w-[1220px] md:min-h-[600px] lg:min-h-[900px] md:px-0"
    >
      {/* Background layers */}
      <div className={styles.heroBg}>

      {/* Header positioned at top of hero container */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <Header />
      </div>

      <div className="relative z-10 w-full mx-auto space-y-4 md:space-y-5 lg:space-y-6 mb-6 md:mb-7 lg:mb-9 max-w-md md:max-w-[500px] lg:max-w-[588px] mt-16 md:mt-[120px] lg:mt-[160px] px-4 text-center">
        <h1 className="text-foreground text-3xl md:text-4xl lg:text-6xl font-semibold leading-tight">
          Streamline Your Auto Garage Operations
        </h1>
        <p className="text-muted-foreground text-base md:text-base lg:text-lg font-medium leading-relaxed max-w-lg mx-auto">
          Professional garage management software for modern repair shops. Track jobs, manage customers, and grow your business.
        </p>
      </div>

      <div className="relative z-10 flex justify-center">
        <CallbackForm
          trigger={
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10">
              Request Demo
            </Button>
          }
        />
      </div>

      {/* Cards Section */}
      <div className="relative mt-16 z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl px-4 pb-20">
        {cards.map((card, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-background/60 backdrop-blur-sm"
          >
            <div className="p-3 rounded-lg border border-[var(--primary)] text-[var(--primary)] w-fit mb-4">
              <card.icon className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-semibold mb-2">{card.title}</h3>

            <p className="text-sm text-muted-foreground">{card.desc}</p>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}
