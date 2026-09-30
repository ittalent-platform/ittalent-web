import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AuthHeroCopy } from "./auth-hero-copy";
import { AuthPageShell } from "./auth-page-shell";

/** A full auth screen for one outcome or form: the same split layout as sign in, content centred on the right. */
export function AuthCardPage({ children }: { children: ReactNode }) {
  return <AuthPageShell aside={<AuthHeroCopy />}>{children}</AuthPageShell>;
}

/** The centred column (440px) that holds a result or a form on an auth screen; no box, the screen is the container. */
export function AuthStatusCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("w-full max-w-[440px] px-6 py-10", className)}>{children}</div>;
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
