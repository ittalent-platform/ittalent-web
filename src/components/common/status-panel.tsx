import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatusPanelTone = "brand" | "danger" | "info" | "neutral" | "success" | "warning";

// Icon tile colours per outcome (Authentication design: result screens).
const TONE_CLASS: Record<StatusPanelTone, string> = {
  brand: "bg-(--status-peach-bg) text-(--status-peach-fg)",
  danger: "bg-(--status-error-bg) text-(--status-error-fg)",
  info: "bg-(--status-info-bg) text-(--status-info-fg)",
  neutral: "bg-(--status-neutral-bg) text-(--status-neutral-fg)",
  success: "bg-(--status-success-bg) text-(--status-success-fg)",
  warning: "bg-(--status-warning-bg) text-(--status-warning-fg)",
};

/**
 * Left-aligned outcome block for a full auth screen: a 64px rounded icon tile, a Space Grotesk title, an explanation,
 * optional numbered steps, banners (children), an action row, a note and a footer line.
 */
export function StatusPanel({
  actions,
  children,
  className,
  description,
  footer,
  icon: Icon,
  iconClassName,
  note,
  steps,
  title,
  tone = "info",
}: {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  footer?: ReactNode;
  icon: LucideIcon;
  iconClassName?: string;
  note?: ReactNode;
  steps?: ReactNode[];
  title: ReactNode;
  tone?: StatusPanelTone;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-[22px]", className)}>
      <span className={cn("flex size-16 items-center justify-center self-start rounded-[18px]", TONE_CLASS[tone])}>
        <Icon aria-hidden className={cn("size-7", iconClassName)} strokeWidth={2} />
      </span>
      <div className="flex flex-col gap-2.5">
        <h1 className="itt-display text-[30px] font-semibold tracking-[-0.01em] text-foreground">{title}</h1>
        {description ? <p className="text-[14.5px] leading-[1.6] text-(--status-neutral-fg)">{description}</p> : null}
      </div>
      {steps?.length ? (
        <ol className="flex flex-col gap-3 rounded-[14px] border border-border bg-card px-[18px] py-4">
          {steps.map((step, index) => (
            <li className="flex items-start gap-3" key={index}>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--status-neutral-bg) text-xs font-bold text-(--status-neutral-fg)">
                {index + 1}
              </span>
              <span className="pt-0.5 text-[13.5px] leading-[1.55] text-(--status-neutral-fg)">{step}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {children}
      {actions ? <div className="grid auto-cols-fr grid-flow-col gap-3 [&>*]:w-full">{actions}</div> : null}
      {note ? <p className="text-center text-[12.5px] leading-[1.55] text-muted-foreground">{note}</p> : null}
      {footer ? <p className="text-center text-[13.5px] text-muted-foreground">{footer}</p> : null}
    </div>
  );
}
