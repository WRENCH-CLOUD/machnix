import { forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface InvisibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isMultiline?: false
}

export interface InvisibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isMultiline: true
}

export const InvisibleInput = forwardRef<HTMLInputElement, InvisibleInputProps>(
  ({ className, isMultiline: _isMultiline, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn(
        "border-none bg-transparent p-0 shadow-none focus-visible:ring-0",
        className
      )}
      {...props}
    />
  )
)
InvisibleInput.displayName = "InvisibleInput"

export const InvisibleTextarea = forwardRef<HTMLTextAreaElement, InvisibleTextareaProps>(
  ({ className, isMultiline: _isMultiline, ...props }, ref) => (
    <Textarea
      ref={ref}
      className={cn(
        "border-none bg-transparent! dark:bg-transparent! p-0 shadow-none focus-visible:ring-0 resize-none",
        className
      )}
      {...props}
    />
  )
)
InvisibleTextarea.displayName = "InvisibleTextarea"

// Export a Pattern component for demo/reference
export function Pattern() {
  return (
    <div className="space-y-4">
      <InvisibleInput placeholder="Single line invisible input..." />
      <InvisibleTextarea isMultiline placeholder="Multi-line invisible textarea..." />
    </div>
  )
}
