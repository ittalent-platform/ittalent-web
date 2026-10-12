import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Two columns of label-over-value facts (one column on phones). */
export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("m-0 grid gap-x-8 gap-y-5 sm:grid-cols-2", className)}>{children}</dl>;
}

/** One fact in a FieldGrid: small muted label, value below. */
export function Field({ children, className, label }: { children: ReactNode; className?: string; label: ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="m-0 mt-1.5 text-[15px] font-semibold wrap-anywhere text-foreground">{children}</dd>
    </div>
  );
}
