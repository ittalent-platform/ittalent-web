import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function DropdownMenu(props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger(props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-[210px] overflow-hidden rounded-lg border border-border bg-card py-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuItem({
  className,
  reason,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  reason?: string
  variant?: "default" | "destructive" | "info" | "success" | "violet" | "warning"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-variant={variant}
      className={cn(
        "flex cursor-pointer items-center gap-2 border-t border-border px-3.5 py-2.5 text-[13.5px] outline-none select-none first:border-t-0 data-[highlighted]:bg-muted",
        "text-foreground",
        variant === "destructive" && "text-destructive data-[highlighted]:bg-destructive/10",
        variant === "success" && "text-(--status-success-fg) data-[highlighted]:bg-(--status-success-bg)",
        variant === "warning" && "text-(--status-warning-fg) data-[highlighted]:bg-(--status-warning-bg)",
        variant === "info" && "text-(--status-info-fg) data-[highlighted]:bg-(--status-info-bg)",
        variant === "violet" && "text-(--status-blocked-fg) data-[highlighted]:bg-(--status-blocked-bg)",
        props.disabled && "pointer-events-none text-muted-foreground/50 data-[highlighted]:bg-transparent",
        className,
      )}
      {...props}
    >
      {props.children}
      {reason ? <span className="text-[11px]">{reason}</span> : null}
    </DropdownMenuPrimitive.Item>
  )
}

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger }
