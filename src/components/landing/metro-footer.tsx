"use client"

import { Wrench } from "lucide-react"
import { useMetroTheme, themeStyles } from "./metro-theme"

export function FooterSection() {
  const { theme } = useMetroTheme()
  const t = themeStyles[theme]

  return (
    <footer className={`py-12 border-t ${t.border}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className={`flex items-center gap-3 ${t.textSubtle}`}>
          <Wrench className="w-3.5 h-3.5" />
          <span className="font-sans text-sm">
            WrenchCloud &copy; {new Date().getFullYear()}
          </span>
        </div>
        <div className={`flex gap-8 font-sans text-sm ${t.textSubtle}`}>
          <a
            href="#"
            className="hover:text-primary transition-colors duration-300"
          >
            Privacy
          </a>
          <a
            href="#"
            className="hover:text-primary transition-colors duration-300"
          >
            Terms
          </a>
          <a
            href="mailto:info@wrenchcloud.com"
            className="hover:text-primary transition-colors duration-300"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}
