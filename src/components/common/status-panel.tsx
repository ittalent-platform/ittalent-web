import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatusPanelTone = "danger" | "info" | "neutral" | "success" | "warning";

// Icon disc colours per outcome (Authentication design: result cards).
const TONE_CLASS: Record<StatusPanelTone, string> = {
  danger: "bg-(--status-error-bg) text-(--status-error-fg)",
  info: "bg-(--status-info-bg) text-(--status-info-fg)",
  neutral: "bg-muted text-foreground",
  success: "bg-(--status-success-bg) text-(--status-success-fg)",
  warning: "bg-(--status-warning-bg) text-(--status-warning-fg)",
};

/**
 * Centred outcome block: a 56px icon disc, a Space Grotesk title, a short explanation, an action row and a note.
 * Used for "Check your email", "Email verified", "This link has expired" and similar results.
 */
export function StatusPanel({
  actions,
  children,
  className,
  description,
  icon: Icon,
  iconClassName,
  note,
  title,
  tone = "info",
}: {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  icon: LucideIcon;
  iconClassName?: string;
  note?: ReactNode;
  title: ReactNode;
  tone?: StatusPanelTone;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <span className={cn("flex size-14 items-center justify-center rounded-full", TONE_CLASS[tone])}>
        <Icon aria-hidden className={cn("size-6", iconClassName)} strokeWidth={2} />
      </span>
      <h1 className="itt-display mt-1 text-xl font-semibold text-foreground">{title}</h1>
      {description ? <p className="max-w-[400px] text-[13.5px] leading-[1.6] text-(--status-neutral-fg)">{description}</p> : null}
      {children}
      {actions ? <div className="mt-1.5 flex flex-wrap justify-center gap-3">{actions}</div> : null}
      {note ? <p className="text-[12.5px] text-muted-foreground">{note}</p> : null}
    </div>
  );
}
