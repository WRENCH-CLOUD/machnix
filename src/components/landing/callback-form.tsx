"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2, Phone } from "lucide-react"

interface CallbackFormData {
  name: string
  phone: string
  email: string
  business_name: string
  message: string
}

export function CallbackForm() {
  const [formData, setFormData] = useState<CallbackFormData>({
    name: "",
    phone: "",
    email: "",
    business_name: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/callbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit request")
      }

      setIsSuccess(true)
      setFormData({
        name: "",
        phone: "",
        email: "",
        business_name: "",
        message: "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-white">Thank You!</h3>
          <p className="text-muted-foreground">
            We&apos;ve received your request and will call you back shortly.
          </p>
          <Button
            variant="ghost"
            className="mt-4 text-emerald-400 hover:text-emerald-300"
            onClick={() => setIsSuccess(false)}
          >
            Submit another request
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div id="callback-form" className="w-full max-w-md mx-auto p-6 md:p-8 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Phone className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Request a Callback</h3>
          <p className="text-sm text-muted-foreground">We&apos;ll get back to you within 24 hours</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white/80">
            Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white/80">
            Phone <span className="text-red-400">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_name" className="text-white/80">
            Business Name
          </Label>
          <Input
            id="business_name"
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            placeholder="Your garage/shop name"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-white/80">
            Message
          </Label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Tell us about your requirements..."
            rows={3}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-full transition-all duration-200 shadow-lg shadow-emerald-500/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Request Callback"
          )}
        </Button>
      </form>
    </div>
  )
}
