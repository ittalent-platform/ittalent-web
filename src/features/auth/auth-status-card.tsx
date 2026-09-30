import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AuthHeroCopy } from "./auth-hero-copy";
import { AuthPageShell } from "./auth-page-shell";


/** An auth outcome or form screen: the same split layout as sign in, with the content column on the right. */
export function AuthCardPage({ children }: { children: ReactNode }) {
  return (
    <AuthPageShell aside={<AuthHeroCopy />}>
      <div className="flex w-full flex-1 items-center justify-center px-5 py-10 sm:px-10">{children}</div>
    </AuthPageShell>
  );
}

/** The 440px content column of an auth screen; no box, the screen is the container. */
export function AuthStatusCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("w-full max-w-[440px]", className)}>{children}</div>;
}

/** Left-aligned 30px title + explanation at the top of a form screen. */
export function AuthFormHeader({ description, title }: { description?: ReactNode; title: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="itt-display text-[30px] font-semibold tracking-[-0.01em] text-foreground">{title}</h1>
      {description ? <p className="text-[14.5px] leading-[1.55] text-muted-foreground">{description}</p> : null}
    </div>
  );
}
