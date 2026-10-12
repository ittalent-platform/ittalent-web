import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CalloutTone = "error" | "info" | "neutral" | "success" | "warning";

const TONE_CLASS: Record<CalloutTone, string> = {
  error: "border-(--status-error-border) bg-(--status-error-bg) text-(--status-error-fg)",
  info: "border-(--status-info-border) bg-(--status-info-bg) text-(--status-info-fg)",
  neutral: "border-border bg-muted text-foreground",
  success: "border-(--status-success-fg)/25 bg-(--status-success-bg) text-(--status-success-fg)",
  warning: "border-(--status-warning-fg)/25 bg-(--status-warning-bg) text-(--status-warning-fg)",
};

/** A 12px tinted box for a rule or outcome that applies to the view in front of the user. */
export function Callout({ children, className, icon: Icon, role, title, tone = "neutral" }: { children?: ReactNode; className?: string; icon?: LucideIcon; role?: "alert" | "status"; title: ReactNode; tone?: CalloutTone }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1 wrap-anywhere rounded-xl border px-4 py-3.5 text-[13.5px] leading-normal", TONE_CLASS[tone], className)} role={role}>
      <p className="flex items-center gap-2 font-semibold">
        {Icon ? <Icon aria-hidden className="size-4 shrink-0" /> : null}
        <span className="min-w-0">{title}</span>
      </p>
      {children ? <div className="font-normal">{children}</div> : null}
    </div>
  );
}
