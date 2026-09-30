import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateAction = {
  label: string;
  onClick: () => void;
  /** "outline" for a quiet secondary CTA such as "Clear filters"; defaults to the Ember primary. */
  variant?: "default" | "outline";
};

type EmptyStateProps = {
  action?: EmptyStateAction;
  description: string;
  icon?: LucideIcon;
  secondaryAction?: EmptyStateAction;
  title: string;
  tone?: "accent" | "neutral";
};

export function EmptyState({
  action,
  description,
  icon,
  secondaryAction,
  title,
  tone = "neutral",
}: EmptyStateProps) {
  const Icon = icon;

  return (
    <div className="flex min-h-[270px] flex-col items-center justify-center px-6 py-12 text-center">
      {Icon ? (
        <div
          className={cn(
            "grid size-12 place-items-center rounded-full",
            tone === "accent"
              ? "bg-(--primary-100) text-primary"
              : "bg-muted text-(--status-disabled-fg)",
          )}
        >
          <Icon className="size-7" />
        </div>
      ) : null}
      <h2 className="mt-4 text-[20px] font-semibold leading-tight text-foreground">
        {title}
      </h2>
      <p className="mt-3 max-w-[335px] text-[15px] leading-[1.85] text-muted-foreground">
        {description}
      </p>
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-col items-center gap-3">
          {action ? (
            <Button
              className="h-11 px-7 text-[15px] font-semibold"
              onClick={action.onClick}
              shape="pill"
              variant={action.variant ?? "default"}
            >
              {action.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button onClick={secondaryAction.onClick} variant="link">
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
