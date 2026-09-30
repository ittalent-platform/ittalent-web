import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Page for a single auth card: the canvas background with the card centred (Authentication design). */
export function AuthCardPage({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen w-full items-center justify-center bg-(--app-canvas) px-5 py-8 sm:px-6 sm:py-10">{children}</div>;
}

/** The 520px result/form card of the Authentication design: white, hairline border, 16px radius. */
export function AuthStatusCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("w-full max-w-[520px] rounded-2xl border border-border bg-card px-[30px] py-8", className)}>
      {children}
    </div>
  );
}

/** Left-aligned title + explanation at the top of a form card. */
export function AuthFormHeader({ description, title }: { description?: ReactNode; title: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="itt-display text-xl font-semibold text-foreground">{title}</h1>
      {description ? <p className="text-[13.5px] leading-[1.55] text-muted-foreground">{description}</p> : null}
    </div>
  );
}
