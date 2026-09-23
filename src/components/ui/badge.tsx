import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-xs font-semibold leading-normal whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-(--status-neutral-bg) text-(--status-neutral-fg)",
        peach: "bg-(--status-peach-bg) text-(--status-peach-fg)",
        success: "bg-(--status-success-bg) text-(--status-success-fg)",
        destructive: "bg-destructive/10 text-destructive",
        blocked: "bg-(--status-blocked-bg) text-(--status-blocked-fg)",
        warning: "bg-(--status-warning-bg) text-(--status-warning-fg)",
        info: "bg-(--status-info-bg) text-(--status-info-fg)",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
  )
}

export { Badge, badgeVariants }
