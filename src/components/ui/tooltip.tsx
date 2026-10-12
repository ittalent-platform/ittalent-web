import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const TOOLTIP_DELAY_MS = 150;

/** Hover and keyboard-focus hint; the trigger must be focusable for the focus path to work. */
function Tooltip({ children, content, className }: { children: React.ReactNode; className?: string; content: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={TOOLTIP_DELAY_MS}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className={cn("z-[1300] max-w-[min(20rem,calc(100vw-2rem))] rounded-md bg-foreground px-3 py-2 text-xs leading-normal text-background shadow-lg wrap-anywhere", className)}
            side="top"
            sideOffset={6}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { Tooltip };
