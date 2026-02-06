"use client";

import { useState } from "react";
import { MessageCircle, Send, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type GupshupEvent = "job_ready" | "job_delivered" | "invoice_created" | "payment_received";

interface WhatsAppSendButtonProps {
    jobId: string;
    customerPhone?: string;
    customerName?: string;
    jobNumber?: string;
    vehicleRegNo?: string;
    className?: string;
}

const eventLabels: Record<GupshupEvent, string> = {
    job_ready: "Job Ready for Pickup",
    job_delivered: "Job Delivered",
    invoice_created: "Invoice Created",
    payment_received: "Payment Received",
};

export function WhatsAppSendButton({
    jobId,
    customerPhone,
    customerName,
    jobNumber,
    vehicleRegNo,
    className,
}: WhatsAppSendButtonProps) {
    const [sending, setSending] = useState(false);

    const handleSend = async (event: GupshupEvent) => {
        if (!customerPhone) {
            toast.error("Customer phone number not available");
            return;
        }

        try {
            setSending(true);

            const res = await fetch("/api/tenant/gupshup/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobId,
                    event,
                    customerPhone,
                    params: {
                        customer_name: customerName || "Customer",
                        job_number: jobNumber || "",
                        vehicle_reg: vehicleRegNo || "",
                    },
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to send message");
            }

            toast.success(`WhatsApp message sent: ${eventLabels[event]}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to send WhatsApp message");
        } finally {
            setSending(false);
        }
    };

    if (!customerPhone) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={className}
                    disabled={sending}
                >
                    {sending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <MessageCircle className="w-4 h-4 mr-2" />
                    )}
                    Send WhatsApp
                    <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {Object.entries(eventLabels).map(([event, label]) => (
                    <DropdownMenuItem
                        key={event}
                        onClick={() => handleSend(event as GupshupEvent)}
                    >
                        <Send className="w-4 h-4 mr-2" />
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
