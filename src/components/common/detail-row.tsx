import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DetailRow({
  bordered = true,
  className,
  label,
  layout = "split",
  value,
}: {
  bordered?: boolean;
  className?: string;
  label: string;
  /** "split" is the compact label / right-aligned value line; "grid" is the 160px label column used on detail pages. */
  layout?: "grid" | "split";
  value: ReactNode;
}) {
  if (layout === "grid") {
    return (
      <div className={cn("grid min-w-0 gap-1 border-t border-border/50 first:border-t-0 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4", className)}>
        <dt className="text-[13px] text-muted-foreground">{label}</dt>
        <dd className="m-0 min-w-0 wrap-anywhere text-[13.5px] text-foreground">{value}</dd>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col items-start gap-1 py-2.5 text-[13.5px] sm:flex-row sm:justify-between sm:gap-4", bordered && "border-b border-border last:border-b-0", className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 wrap-anywhere font-medium text-foreground sm:text-right">{value}</span>
    </div>
  );
}
