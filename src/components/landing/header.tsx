"use client"

import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"
import { CallbackForm } from "./callback-form"

export function Header() {
  const [callbackOpen, setCallbackOpen] = useState(false)
  
  const navItems = [
    { name: "Features", href: "#features-section" },
    { name: "Pricing", href: "#pricing-section" },
  ]

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.substring(1)
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      <header className="w-full py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-foreground text-lg md:text-xl font-semibold leading-tight">Wrench Cloud</span>
              <span className="text-muted-foreground text-xs font-normal">Garage Management Software</span>
            </div>
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleScroll(e, item.href)}
                  className="text-[#888888] hover:text-foreground px-4 py-2 rounded-full font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop buttons */}
            <Link href="/login" className="hidden md:block">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-full font-medium">
                Login
              </Button>
            </Link>
            <Button 
              onClick={() => setCallbackOpen(true)}
              className="hidden md:flex bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full font-medium shadow-sm"
            >
              Request Demo
            </Button>
            
            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-7 w-7" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-background border-t border-border text-foreground rounded-t-2xl px-6 pb-8 pt-3">
                {/* Drag handle indicator */}
                <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-4" />
                
                {/* Brand header */}
                <SheetHeader className="mb-6">
                  <div className="flex flex-col">
                    <SheetTitle className="text-left text-xl font-semibold text-foreground">Wrench Cloud</SheetTitle>
                    <span className="text-muted-foreground text-sm">Garage Management Software</span>
                  </div>
                </SheetHeader>
                
                {/* Navigation links */}
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.name}>
                      <Link
                        href={item.href}
                        onClick={(e) => handleScroll(e, item.href)}
                        className="text-foreground hover:bg-muted/50 rounded-lg px-4 py-3 text-base font-medium transition-colors"
                      >
                        {item.name}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                
                {/* CTA section */}
                <div className="mt-6 pt-6 border-t border-border flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button 
                      onClick={() => setCallbackOpen(true)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-full font-medium shadow-sm"
                    >
                      Request Demo
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/login" className="w-full">
                      <Button variant="outline" className="w-full py-3 rounded-full font-medium">
                        Login
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      
      {/* Callback form modal */}
      <CallbackForm open={callbackOpen} onOpenChange={setCallbackOpen} />
    </>
  )
}
