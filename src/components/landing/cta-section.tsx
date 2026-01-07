import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CallbackForm } from "./callback-form"

export function CTASection() {
  return (
    <section id="callback-section" className="w-full pt-20 md:pt-40 lg:pt-60 pb-10 md:pb-20 px-5 relative flex flex-col justify-center items-center overflow-visible">
      {/* Optimized: replaced complex SVG with CSS gradients */}
      <div className="absolute inset-0 top-[-90px] overflow-hidden pointer-events-none">
        {/* Primary glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, hsl(var(--primary)) 0%, transparent 70%)',
          }}
        />
        {/* Subtle overlay */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 20%, white 0%, transparent 60%)',
          }}
        />
      </div>
      <div className="relative z-10 flex flex-col justify-start items-center gap-9 max-w-4xl mx-auto">
        <div className="flex flex-col justify-start items-center gap-4 text-center">
          <h2 className="text-foreground text-4xl md:text-5xl lg:text-[68px] font-semibold leading-tight md:leading-tight lg:leading-[76px] break-words max-w-[435px]">
            Ready to Modernize Your Shop?
          </h2>
          <p className="text-muted-foreground text-sm md:text-base font-medium leading-[18.20px] md:leading-relaxed break-words max-w-2xl">
            Join thousands of auto shops using machnix to streamline operations and boost customer satisfaction.
          </p>
        </div>
        
        {/* Callback Form */}
        <CallbackForm />
        
        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <span>Already have an account?</span>
          <Link href="/login">
            <Button
              variant="outline"
              className="px-6 py-2 border-white/20 text-white hover:bg-white/10 rounded-full transition-all duration-200"
            >
              Login
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
