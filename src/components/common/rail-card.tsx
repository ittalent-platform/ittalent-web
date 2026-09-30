import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Side-rail card: 16px radius, hairline border, overline title with an optional trailing meta value. */
export function RailCard({ ariaLabel, children, className, meta, title }: { ariaLabel?: string; children: ReactNode; className?: string; meta?: ReactNode; title: string }) {
  return (
    <section aria-label={ariaLabel} className={cn("flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{title}</h2>
        {meta ? <span className="itt-mono text-[11px] text-muted-foreground">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}
