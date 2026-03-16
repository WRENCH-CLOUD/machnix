"use client"

import { useId, useState, useEffect } from "react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { RiCalendarLine, RiTimeLine } from '@remixicon/react'

export interface DateTimePickerProps {
    date?: Date;
    setDate?: (date: Date | undefined) => void;
    className?: string;
}

export function DateTimePicker({ date, setDate, className }: DateTimePickerProps) {
    const id = useId()
    const [localDate, setLocalDate] = useState<Date | undefined>(
        date || new Date()
    )

    // Try to extract time from initial date
    const [startTime, setStartTime] = useState<string>("10:30:00")
    const [endTime, setEndTime] = useState<string>("12:30:00")

    // Sync props internally if they change
    useEffect(() => {
        if (date) {
            setLocalDate(date);
        }
    }, [date])

    const handleDateSelect = (newDate: Date | undefined) => {
        setLocalDate(newDate);
        if (setDate && newDate) {
            // In a real implementation you'd combine newDate with startTime/endTime
            setDate(newDate);
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    className={cn("group/pick-date w-60 justify-between", className)}
                    id={id}
                    variant={"outline"}
                >
                    <span className={cn("truncate", !localDate && "text-muted-foreground")}>
                        {localDate ? format(localDate, "PPP") : "Pick a date and time"}
                    </span>
                    <RiCalendarLine aria-hidden="true" className="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={localDate}
                    onSelect={handleDateSelect}
                    className="p-3"
                />

                <Separator />

                <div className="p-3">
                    <FieldGroup className="grid grid-cols-2 gap-2.5">
                        <Field className="gap-1.5 flex-col items-start w-full">
                            <FieldLabel htmlFor={`${id}-time-from`}>Start Time</FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    id={`${id}-time-from`}
                                    type="time"
                                    step="1"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                                <InputGroupAddon align="inline-end">
                                    <RiTimeLine />
                                </InputGroupAddon>
                            </InputGroup>
                        </Field>
                        <Field className="gap-1.5 flex-col items-start w-full">
                            <FieldLabel htmlFor={`${id}-time-to`}>End Time</FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    id={`${id}-time-to`}
                                    type="time"
                                    step="1"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                                <InputGroupAddon align="inline-end">
                                    <RiTimeLine />
                                </InputGroupAddon>
                            </InputGroup>
                        </Field>
                    </FieldGroup>
                </div>
            </PopoverContent>
        </Popover>
    )
}
