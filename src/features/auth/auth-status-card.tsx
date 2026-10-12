import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { BrandLogo } from "@/components/layout/brand-logo";

import { AuthHeroCopy } from "./auth-hero-copy";
import type { AuthHeroTone } from "./auth-hero.constants";
import { AuthPageShell } from "./auth-page-shell";


/** An auth outcome or form screen: the same split layout as sign in, with the content column on the right. */
export function AuthCardPage({ children, tone }: { children: ReactNode; tone?: AuthHeroTone }) {
  return (
    <AuthPageShell aside={<AuthHeroCopy tone={tone} />} tone={tone}>
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

/** Centred card with the ITTALENT logo, used by the one-off links people open from an email. */
export function AuthCenteredCard({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-10">
      <div className="flex w-full max-w-[440px] flex-col gap-6 surface-card p-8">
        <BrandLogo />
        {children}
      </div>
    </main>
  );
}

/** Grey label/value box: the label on the left, the value bold on the right. */
export function AuthFactsBox({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="flex flex-col gap-2.5 rounded-xl border border-border bg-(--status-neutral-bg)/60 px-4 py-3.5 text-[13.5px]">
      {rows.map((row) => (
        <div className="flex items-baseline justify-between gap-4" key={row.label}>
          <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 text-right font-semibold break-all text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
