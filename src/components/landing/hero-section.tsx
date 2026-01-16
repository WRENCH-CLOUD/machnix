import React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Header } from "./header"
import { CallbackForm } from "./callback-form"
import styles from "./hero-section.module.css"

const blocks = [
  { x: "8%", y: "18%", s: "56px", o: 0.16 },
  { x: "18%", y: "34%", s: "82px", o: 0.12 },
  { x: "10%", y: "62%", s: "64px", o: 0.1 },
  { x: "34%", y: "14%", s: "48px", o: 0.12 },
  { x: "42%", y: "42%", s: "96px", o: 0.08 },
  { x: "56%", y: "22%", s: "64px", o: 0.1 },
  { x: "62%", y: "58%", s: "76px", o: 0.09 },
  { x: "72%", y: "16%", s: "60px", o: 0.1 },
  { x: "78%", y: "38%", s: "110px", o: 0.07 },
  { x: "86%", y: "62%", s: "74px", o: 0.09 },
  { x: "90%", y: "28%", s: "58px", o: 0.1 },
  { x: "92%", y: "74%", s: "52px", o: 0.1 },
] as const

export function HeroSection() {
  return (
    <section
      className="flex flex-col items-center text-center relative mx-auto rounded-2xl overflow-hidden my-6 py-0 px-4
         w-full min-h-[600px] md:w-[1220px] md:min-h-[900px] lg:min-h-[1100px] md:px-0"
    >
      {/* Background layers */}
      <div className={styles.heroBg}>
        <div className={styles.blocks} aria-hidden="true">
          {blocks.map((block, index) => (
            <span
              key={`${block.x}-${block.y}-${block.s}-${index}`}
              className={styles.block}
              style={
                {
                  "--x": block.x,
                  "--y": block.y,
                  "--s": block.s,
                  "--o": String(block.o),
                } as React.CSSProperties
              }
            />
          ))}
        </div>

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

      {/* Dashboard Preview Image */}
      <div className="relative z-10 mt-10 md:mt-14 lg:mt-16 w-full max-w-[1160px] px-4">
        <div className="bg-gradient-to-b from-emerald-500/30 to-transparent rounded-2xl p-1 md:p-2 shadow-2xl">
          <Image
            src="/dashboard-page.jpeg"
            alt="Wrench Cloud Dashboard Preview"
            width={1160}
            height={800}
            className="w-full h-auto object-cover rounded-xl shadow-lg border border-white/10"
            priority
            sizes="(max-width: 768px) 92vw, 1160px"
            quality={85}
          />
        </div>
      </div>
      </div>
    </section>
  )
}
