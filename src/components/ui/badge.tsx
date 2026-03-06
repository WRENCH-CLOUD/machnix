import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'rounded-sm relative inline-flex shrink-0 items-center justify-center w-fit border border-transparent font-medium whitespace-nowrap outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        outline: 'border-border bg-transparent dark:bg-input/32',
        secondary: 'bg-secondary text-secondary-foreground',
        info: 'bg-secondary text-secondary-foreground',
        success: 'bg-primary text-primary-foreground',
        warning: 'bg-destructive text-destructive-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        invert: 'bg-foreground text-background',
        'primary-light':
          'bg-primary/10 border-none text-primary dark:bg-primary/20',
        'warning-light':
          'bg-destructive/10 border-none text-destructive-foreground dark:bg-destructive/20',
        'success-light':
          'bg-primary/10 border-none text-primary dark:bg-primary/20',
        'info-light':
          'bg-secondary/10 border-none text-secondary-foreground dark:bg-secondary/20',
        'destructive-light':
          'bg-destructive/10 border-none text-destructive-foreground dark:bg-destructive/20',
        'invert-light':
          'bg-foreground/10 border-none text-foreground dark:bg-foreground/20',
        'primary-outline':
          'bg-background border-border text-primary dark:bg-input/30',
        'warning-outline':
          'bg-background border-border text-destructive-foreground dark:bg-input/30',
        'success-outline':
          'bg-background border-border text-primary dark:bg-input/30',
        'info-outline':
          'bg-background border-border text-secondary-foreground dark:bg-input/30',
        'destructive-outline':
          'bg-background border-border text-destructive-foreground dark:bg-input/30',
        'invert-outline':
          'bg-background border-border text-foreground dark:bg-input/30',
      },
      size: {
        xs: 'px-1 py-0.25 text-[0.6rem] leading-none h-4 min-w-4 gap-1',
        sm: 'px-1 py-0.25 text-[0.625rem] leading-none h-4.5 min-w-4.5 gap-1',
        default: 'px-1.5 py-0.5 text-xs h-5 min-w-5 gap-1',
        lg: 'px-2 py-0.5 text-xs h-5.5 min-w-5.5 gap-1',
        xl: 'px-2.5 py-0.75 text-sm h-6 min-w-6 gap-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
  }

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
