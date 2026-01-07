import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Header } from "./header"
import Link from "next/link"

export function HeroSection() {
  return (
    <section
      className="flex flex-col items-center text-center relative mx-auto rounded-2xl overflow-hidden my-6 py-0 px-4
         w-full min-h-[600px] md:w-[1220px] md:min-h-[900px] lg:min-h-[1100px] md:px-0"
    >
      {/* Optimized CSS Background - replaces heavy SVG */}
      <div className="absolute inset-0 z-0 rounded-2xl overflow-hidden">
        {/* Grid pattern using CSS */}
        <div 
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px',
          }}
        />
        {/* Primary gradient glow - top right */}
        <div 
          className="absolute -top-[200px] -right-[100px] w-[800px] h-[800px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, #4ade80 0%, #22c55e 40%, transparent 70%)',
          }}
        />
        {/* Secondary gradient glow - creates depth */}
        <div 
          className="absolute top-[100px] right-[50px] w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #ffffff 0%, #4ade80 30%, transparent 60%)',
          }}
        />
        {/* Border */}
        <div className="absolute inset-0 rounded-2xl border border-white/[0.06]" />
      </div>

      {/* Header positioned at top of hero container */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <Header />
      </div>

      <div className="relative z-10 space-y-4 md:space-y-5 lg:space-y-6 mb-6 md:mb-7 lg:mb-9 max-w-md md:max-w-[500px] lg:max-w-[588px] mt-16 md:mt-[120px] lg:mt-[160px] px-4">
        <h1 className="text-foreground text-3xl md:text-4xl lg:text-6xl font-semibold leading-tight">
          Streamline Your Auto Shop Operations
        </h1>
        <p className="text-muted-foreground text-base md:text-base lg:text-lg font-medium leading-relaxed max-w-lg mx-auto">
          Professional garage management software for modern repair shops. Track jobs, manage customers, and grow your business.
        </p>
      </div>

      <Link href="/login">
        <Button className="relative z-10 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10">
          Start Free Trial
        </Button>
      </Link>

      {/* Dashboard Preview Image */}
      <div className="relative z-10 mt-10 md:mt-14 lg:mt-16 w-full max-w-[1160px] px-4">
        <div className="bg-gradient-to-b from-emerald-500/30 to-transparent rounded-2xl p-1 md:p-2 shadow-2xl">
          <Image
            src="/dashboard-page.jpeg"
            alt="machnix Dashboard Preview"
            width={1160}
            height={700}
            className="w-full h-auto object-cover rounded-xl shadow-lg border border-white/10"
            priority
          />
        </div>
      </div>
    </section>
  )
}
