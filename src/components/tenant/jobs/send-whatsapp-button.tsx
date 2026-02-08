"use client"

import { useState } from "react"
import { MessageCircle, Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { STATUS_DISPLAY_TEXT } from "@/lib/integrations/gupshup.service"

interface SendWhatsAppButtonProps {
    jobId: string
    jobStatus: string
    vehicleNumber: string
    customerPhone: string
    garageName: string
}

export function SendWhatsAppButton({
    jobId,
    jobStatus,
    vehicleNumber,
    customerPhone,
    garageName,
}: SendWhatsAppButtonProps) {
    const [open, setOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const [note, setNote] = useState("")

    async function handleSend(): Promise<void> {
        if (!customerPhone) {
            toast.error("Customer has no phone number on file")
            return
        }

        setSending(true)

        const res = await fetch("/api/tenant/gupshup/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jobId,
                jobStatus,
                customerPhone,
                vehicleNumber,
                garageName,
                note: note || undefined,
            }),
        })

        if (!res.ok) {
            const error = await res.json()
            toast.error(error.error || "Failed to send WhatsApp message")
        } else {
            toast.success("WhatsApp message sent!")
            setOpen(false)
            setNote("")
        }
        setSending(false)
    }

    const statusText = STATUS_DISPLAY_TEXT[jobStatus] || jobStatus

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    title="Send WhatsApp Update"
                >
                    <MessageCircle className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-green-500" />
                        Send WhatsApp Update
                    </DialogTitle>
                    <DialogDescription>
                        Notify customer about their vehicle status
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Status:</span>
                            <p className="font-medium">{statusText}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Vehicle:</span>
                            <p className="font-mono">{vehicleNumber}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Phone:</span>
                            <p className="font-mono">{customerPhone || "Not available"}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Garage:</span>
                            <p className="font-medium">{garageName}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Note (optional)</Label>
                        <Textarea
                            id="note"
                            placeholder={jobStatus === "received"
                                ? "e.g., Estimated delivery: 2 days"
                                : "Add any additional notes..."
                            }
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="p-3 bg-muted rounded-lg text-sm">
                        <p className="text-muted-foreground mb-1">Message preview:</p>
                        <p className="italic">
                            "{statusText}
                            <br />
                            Your vehicle <strong>{vehicleNumber}</strong> at <strong>{garageName}</strong>.
                            {note && <><br />Note: {note}</>}
                            <br />
                            Thank you for choosing us."
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={sending || !customerPhone}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Send Message
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
