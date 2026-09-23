import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PanelCard({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] transition-transform duration-200",
        onClick && "cursor-pointer hover:-translate-y-1",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </article>
  );
}
