"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import {
    PopoverForm,
    PopoverFormButton,
    PopoverFormSeparator,
    PopoverFormSuccess,
} from "@/components/ui/popover-form"
import { sendFeedback, type FeedbackState } from "@/lib/actions/send-feedback"

function SubmitButton() {
    const { pending } = useFormStatus()
    return <PopoverFormButton loading={pending} text="Send" />
}

function FeedbackFormContent({
    state,
    formAction,
}: {
    state: FeedbackState
    formAction: (payload: FormData) => void
}) {
    return (
        <form action={formAction} className="flex h-full flex-col">
            {/* Header area — invisible title is already rendered by PopoverForm */}
            <div className="flex items-center px-4 pt-3 pb-2">
                <span className="text-sm font-medium text-muted-foreground">
                    Send us your feedback
                </span>
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-2.5 px-4 pb-3">
                <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    required
                    autoComplete="name"
                    className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary/40"
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Your email"
                    required
                    autoComplete="email"
                    className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary/40"
                />
                <textarea
                    name="message"
                    placeholder="Your message..."
                    required
                    rows={3}
                    className="w-full resize-none rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary/40"
                />
            </div>

            {/* Error message */}
            {state && !state.success && (
                <p className="px-4 pb-1 text-xs text-red-500">{state.message}</p>
            )}

            {/* Footer */}
            <div className="relative mt-auto flex items-center justify-between px-4 py-3">
                <PopoverFormSeparator />
                <SubmitButton />
            </div>
        </form>
    )
}

export function FeedbackForm() {
    const [open, setOpen] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [state, formAction] = useActionState<FeedbackState, FormData>(
        sendFeedback,
        null
    )
    const prevStateRef = useRef(state)

    // React to successful submission
    useEffect(() => {
        if (state?.success && state !== prevStateRef.current) {
            setShowSuccess(true)
            const timer = setTimeout(() => {
                setShowSuccess(false)
                setOpen(false)
            }, 3000)
            return () => clearTimeout(timer)
        }
        prevStateRef.current = state
    }, [state])

    return (
        <div>
            <PopoverForm
                title="Send Feedback"
                open={open}
                setOpen={setOpen}
                showSuccess={showSuccess}
                showCloseButton
                className="relative"
                width="380px"
                height="270px"
                openChild={<FeedbackFormContent state={state} formAction={formAction} />}
                successChild={
                    <PopoverFormSuccess
                        title="Feedback Sent!"
                        description={state?.message || "Thank you for your feedback."}
                    />
                }
            />
        </div>
    )
}

export default FeedbackForm
