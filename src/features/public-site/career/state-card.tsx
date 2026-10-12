import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StateCard({
  icon,
  iconClassName,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  /** Background colour class for the icon circle, e.g. "bg-mkt-danger-bg". */
  iconClassName: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="box-border flex min-h-[340px] flex-col items-center justify-center gap-3.5 market-card px-8 py-10 text-center">
      <span
        className={cn("flex size-[60px] items-center justify-center rounded-full", iconClassName)}
      >
        {icon}
      </span>
      <span className="itt-display text-[19px] font-semibold">
        {title}
      </span>
      <span className="max-w-[320px] text-[13.5px] leading-[1.55] text-mkt-ink-2">
        {description}
      </span>
      {children}
    </div>
  );
}