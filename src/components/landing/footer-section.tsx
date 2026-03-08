"use client"

import { Linkedin, Instagram } from "lucide-react"

export function FooterSection() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="max-w-[1320px] mx-auto px-6 py-14">

        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between gap-12">

          {/* Brand */}
          <div className="flex flex-col gap-6 max-w-sm">

            <h2 className="text-xl font-semibold tracking-tight">
              <span className="text-primary">Wrench</span> Cloud
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Modern cloud software built for garages and workshops to manage
              operations, track services, and streamline workflow.
            </p>

            {/* Socials */}
            <div className="flex gap-4">
              <a
                href="https://www.linkedin.com/company/wrenchcloud"
                aria-label="LinkedIn"
                className="p-2 rounded-md border border-border hover:border-primary hover:text-primary transition"
              >
                <Linkedin className="w-5 h-5" />
              </a>

              <a
                href="https://www.instagram.com/wrenchcloud.in"
                aria-label="Instagram"
                className="p-2 rounded-md border border-border hover:border-primary hover:text-primary transition"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>

          </div>

          {/* Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">

            {/* Product */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Product
              </h3>

              <a
                href="#features-section"
                className="text-sm text-foreground hover:text-primary transition"
              >
                Features
              </a>

              <a
                href="#pricing-section"
                className="text-sm text-foreground hover:text-primary transition"
              >
                Pricing
              </a>

              {/* <a
                href="#"
                className="text-sm text-foreground hover:text-primary transition"
              >
                Digital Inspections
              </a>

              <a
                href="#"
                className="text-sm text-foreground hover:text-primary transition"
              >
                Multi-Shop
              </a>

              <a
                href="#"
                className="text-sm text-foreground hover:text-primary transition"
              >
                Integrations
              </a> */}
            </div>

            {/* Company */}
            {/* <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Company
              </h3>

              <a href="#" className="text-sm text-foreground hover:text-primary transition">
                About us
              </a>

              <a href="#" className="text-sm text-foreground hover:text-primary transition">
                Our team
              </a>

              <a href="#" className="text-sm text-foreground hover:text-primary transition">
                Careers
              </a>

              <a href="#" className="text-sm text-foreground hover:text-primary transition">
                Brand
              </a>

              <a href="#" className="text-sm text-foreground hover:text-primary transition">
                Contact
              </a>
            </div> */}

            {/* Resources */}
            {/* <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Resources
              </h3>

              <a href="#" className="text-sm text-foreground hover:text-primary transition">
                Terms of use
              </a>

              <a href="#" className="text-sm text-foreground hover:text-primary transition">
                API Reference
              </a>

              <a href="#" className="text-sm text-foreground hover:text-primary transition">
                Documentation
              </a>

              <a href="#" className="text-sm text-foreground hover:text-primary transition">
                Community
              </a>

              <a href="#" className="text-sm text-foreground hover:text-primary transition">
                Support
              </a>
            </div> */}

            {/* Contact */}
            <div className="flex flex-col gap-3 max-w-xs">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Contact
              </h3>

              <p className="text-sm text-muted-foreground">
                Questions or feedback? We'd love to hear from you.
              </p>

              <a
                href="mailto:info@wrenchcloud.com"
                className="text-sm text-primary hover:underline"
              >
                info@wrenchcloud.com
              </a>
            </div>

          </div>
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-border" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">

          <p>
            © {new Date().getFullYear()} Wrench Cloud. All rights reserved.
          </p>

          <div className="flex gap-6">
            <a className="hover:text-primary transition">Privacy</a>
            <a className="hover:text-primary transition">Terms</a>
          </div>

        </div>

      </div>
    </footer>
  )
}