import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DetailRow({
  bordered = true,
  className,
  label,
  value,
}: {
  bordered?: boolean;
  className?: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col items-start gap-1 py-2.5 text-[13.5px] sm:flex-row sm:justify-between sm:gap-4", bordered && "border-b border-border last:border-b-0", className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 wrap-anywhere font-medium text-foreground sm:text-right">{value}</span>
    </div>
  );
}
