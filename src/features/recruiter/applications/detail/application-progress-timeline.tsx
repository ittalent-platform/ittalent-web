import { Check, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import {
  STATUS_TONES,
  type ApplicationStatus,
} from "@/features/recruiter/applications/applications.constants";
import { formatDate } from "@/features/recruiter/applications/applications.format";

export interface StatusHistoryItem {
  status: ApplicationStatus;
  reviewStage?: string | null;
  actorRole?: string | null;
  note?: string | null;
  occurredAt?: string | null;
  timestamp?: string | null;
}

export interface ApplicationProgressTimelineProps {
  currentStatus: ApplicationStatus;
  statusHistory?: StatusHistoryItem[];
  locale?: string;
  className?: string;
}

const LIFECYCLE_STAGES: readonly ApplicationStatus[] = [
  "submitted",
  "under_review",
  "interviewing",
  "offered",
  "hired",
];

export function ApplicationProgressTimeline({
  currentStatus,
  statusHistory = [],
  locale = "en",
  className,
}: ApplicationProgressTimelineProps) {
  const { t } = useTranslation();

  const isTerminalNegative =
    currentStatus === "rejected" ||
    currentStatus === "withdrawn" ||
    currentStatus === "position_filled";

  // Map each status to the latest timestamp recorded in history
  const historyDates = statusHistory.reduce<Record<string, string>>((acc, item) => {
    const ts = item.occurredAt || item.timestamp;
    if (ts && !acc[item.status]) {
      acc[item.status] = ts;
    }
    return acc;
  }, {});

  // Determine active index in the 5-stage pipeline
  const activeIndex = LIFECYCLE_STAGES.indexOf(currentStatus);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-xs",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t("recruiterApplications.detail.progressTitle")}
        </h3>
        {isTerminalNegative ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              STATUS_TONES[currentStatus]?.badge,
            )}
          >
            <XCircle className="size-3.5" />
            {t(`applications.status.${currentStatus}`)}
          </span>
        ) : null}
      </div>

      <div className="relative flex items-start justify-between">
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isPassed = activeIndex !== -1 && idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isUpcoming = activeIndex === -1 || idx > activeIndex;

          const stageTone = STATUS_TONES[stage];
          const rawDate = historyDates[stage];
          const formattedDate = rawDate ? formatDate(rawDate, locale) : null;

          return (
            <div
              className="relative z-10 flex flex-1 flex-col items-center text-center"
              key={stage}
            >
              {/* Connecting line to next stage */}
              {idx < LIFECYCLE_STAGES.length - 1 ? (
                <div
                  aria-hidden
                  className={cn(
                    "absolute top-3.5 left-[50%] -z-10 h-0.5 w-full -translate-y-1/2 transition-colors",
                    isPassed
                      ? "bg-primary"
                      : isCurrent
                        ? "bg-primary/40"
                        : "bg-muted",
                  )}
                />
              ) : null}

              {/* Step indicator node */}
              <div
                className={cn(
                  "grid size-7 place-items-center rounded-full text-xs font-bold transition-all",
                  isPassed &&
                    "bg-primary text-primary-foreground shadow-xs",
                  isCurrent &&
                    cn(
                      "ring-4 bg-primary text-primary-foreground",
                      stageTone.ring || "ring-primary/20",
                    ),
                  isUpcoming &&
                    "border-2 border-border bg-card text-muted-foreground/60",
                )}
              >
                {isPassed ? (
                  <Check className="size-3.5 stroke-[3]" />
                ) : isCurrent ? (
                  <span className="size-2 rounded-full bg-primary-foreground" />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                )}
              </div>

              {/* Stage label and date */}
              <div className="mt-2.5 flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    "text-xs font-semibold tracking-tight",
                    isCurrent
                      ? cn("font-bold", stageTone.text)
                      : isPassed
                        ? "text-foreground"
                        : "text-muted-foreground/70",
                  )}
                >
                  {t(`applications.status.${stage}`)}
                </span>
                {formattedDate ? (
                  <span className="text-[11px] text-muted-foreground">
                    {isCurrent
                      ? t("recruiterApplications.detail.since", { date: formattedDate })
                      : formattedDate}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
