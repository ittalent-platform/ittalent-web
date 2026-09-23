import { TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type InlineBannerAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type InlineBannerProps = {
  children: ReactNode;
  tone?: "error" | "info" | "warning";
  /** Secondary action rendered inline with the message, e.g. "Send verification email". */
  action?: InlineBannerAction;
};

export function InlineBanner({
  children,
  tone = "error",
  action,
}: InlineBannerProps) {
  const Icon = tone === "error" ? X : TriangleAlert;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        tone === "error"
          ? "border-(--status-error-border) bg-(--status-error-bg) text-(--status-error-fg)"
          : tone === "info"
            ? "border-(--status-info-border) bg-(--status-info-bg) text-(--status-info-fg)"
            : "border-(--status-warning-fg)/25 bg-(--status-warning-bg) text-(--status-warning-fg)",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span className="flex-1">{children}</span>
      {action ? (
        <button
          className="shrink-0 rounded-md text-sm font-semibold underline-offset-2 transition hover:underline disabled:pointer-events-none disabled:opacity-50"
          disabled={action.disabled}
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
