import { FileText } from "lucide-react";

import { cn } from "@/lib/utils";

export type DocumentKind = "cv" | "cover_letter";

const KIND_TONE: Record<DocumentKind, string> = {
  cv: "bg-(--status-error-bg) text-(--status-error-fg)",
  cover_letter: "bg-(--status-info-bg) text-(--status-info-fg)",
};

/** Small CV / CL tag (5px radius) shown beside a file name. */
export function DocumentTypeBadge({ kind, label }: { kind: DocumentKind; label: string }) {
  return <span className={cn("inline-flex h-5 items-center rounded-[5px] px-1.5 text-[11px] font-bold", KIND_TONE[kind])}>{label}</span>;
}

/** Outlined chip with a file icon: one submitted document in a list row or board card. */
export function DocumentChip({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex h-[26px] items-center gap-[5px] whitespace-nowrap rounded-[7px] border border-(--border-strong) px-2 text-xs font-semibold text-foreground", className)}>
      <FileText aria-hidden className="size-[13px]" />
      {label}
    </span>
  );
}
