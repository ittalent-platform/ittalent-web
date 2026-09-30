import { Check, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

type InlineBannerAction = {
  label: string;
  /** Navigates instead of running `onClick`; rendered as a link. */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const ACTION_CLASS =
  "shrink-0 rounded-md text-[13px] font-semibold underline-offset-2 transition hover:underline disabled:pointer-events-none disabled:opacity-50";

type BannerTone = "error" | "info" | "success" | "warning";

// Tinted box per outcome (Authentication design: sign-in / sign-up banners).
const TONE_CLASS: Record<BannerTone, string> = {
  error: "border-(--status-error-border) bg-(--status-error-bg) text-(--status-error-fg)",
  info: "border-(--status-info-border) bg-(--status-info-bg) text-(--status-info-fg)",
  success: "border-(--status-success-border) bg-(--status-success-bg) text-(--status-success-fg)",
  warning: "border-(--status-warning-border) bg-(--status-warning-bg) text-(--status-warning-fg)",
};

const TONE_ICON = { error: TriangleAlert, info: Info, success: Check, warning: TriangleAlert } as const;

type InlineBannerProps = {
  children: ReactNode;
  tone?: BannerTone;
  /** Secondary action rendered inline with the message, e.g. "Send verification email". */
  action?: InlineBannerAction;
};

export function InlineBanner({
  children,
  tone = "error",
  action,
}: InlineBannerProps) {
  const Icon = TONE_ICON[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-normal", TONE_CLASS[tone])}
    >
      <Icon aria-hidden className="mt-px size-4 shrink-0" />
      <span className="flex-1">{children}</span>
      {action ? (
        action.href ? (
          <Link className={ACTION_CLASS} to={action.href}>
            {action.label}
          </Link>
        ) : (
          <button className={ACTION_CLASS} disabled={action.disabled} onClick={action.onClick} type="button">
            {action.label}
          </button>
        )
      ) : null}
    </div>
  );
}
