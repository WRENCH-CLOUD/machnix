import { HeroSection } from "@/components/landing/hero-section"
import { BentoSection } from "@/components/landing/bento-section"
import { SocialProof } from "@/components/landing/social-proof"
import { LargeTestimonial } from "@/components/landing/large-testimonial"
import { PricingSection } from "@/components/landing/pricing-section"
import { TestimonialGridSection } from "@/components/landing/testimonial-grid-section"
import { FAQSection } from "@/components/landing/faq-section"
import { CTASection } from "@/components/landing/cta-section"
import { FooterSection } from "@/components/landing/footer-section"

export default function HomePage() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-primary selection:text-primary-foreground scroll-smooth overflow-x-hidden">
      <HeroSection />
      {/* <SocialProof /> */}
      <BentoSection />
      {/* <LargeTestimonial /> */}
      <PricingSection />
      {/* <TestimonialGridSection /> */}
      <FAQSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
