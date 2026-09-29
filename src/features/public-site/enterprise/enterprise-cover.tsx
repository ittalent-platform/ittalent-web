import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Soft branded banner shared by enterprise cards and the enterprise detail page. */
export function EnterpriseCover({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[linear-gradient(135deg,var(--primary-50),var(--surface-2)_75%)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-[radial-gradient(circle,rgba(242,71,12,.22),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--border-strong)_1px,transparent_1px)] [background-size:18px_18px]" />
      {children}
    </div>
  );
}
