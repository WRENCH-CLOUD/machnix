"use server"

import { Resend } from "resend"
import { FeedbackEmail } from "@/emails/feedback-email"

export type FeedbackState = {
  success: boolean
  message: string
} | null

export async function sendFeedback(
  _prevState: FeedbackState,
  formData: FormData
): Promise<FeedbackState> {
  const name = formData.get("name") as string | null
  const email = formData.get("email") as string | null
  const message = formData.get("message") as string | null

  // ---------- Validation ----------
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return { success: false, message: "All fields are required." }
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { success: false, message: "Please enter a valid email address." }
  }

  // ---------- Env guard ----------
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[send-feedback] RESEND_API_KEY is not set.")
    return {
      success: false,
      message: "Email service is not configured. Please try again later.",
    }
  }

  const toEmail = process.env.FEEDBACK_TO_EMAIL
  if (!toEmail) {
    console.error("[send-feedback] FEEDBACK_TO_EMAIL is not set.")
    return {
      success: false,
      message: "Email service is not configured. Please try again later.",
    }
  }

  // ---------- Send email ----------
  try {
    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
      from: "WrenchCloud Feedback <onboarding@resend.dev>",
      to: [toEmail],
      subject: `Feedback from ${name.trim()}`,
      replyTo: email.trim(),
      react: FeedbackEmail({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      }),
    })

    if (error) {
      console.error("[send-feedback] Resend error:", error)
      return {
        success: false,
        message: "Failed to send your feedback. Please try again.",
      }
    }

    return {
      success: true,
      message: "Thank you! Your feedback has been sent.",
    }
  } catch (err) {
    console.error("[send-feedback] Unexpected error:", err)
    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    }
  }
}
