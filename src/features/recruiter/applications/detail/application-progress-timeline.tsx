import React from "react";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/features/recruiter/applications/applications.constants";
import {
  formatDate,
  formatShortDate,
} from "@/features/recruiter/applications/applications.format";

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

interface StageVisualConfig {
  color: string;
  activeRing: string;
  upcomingBg: string;
  upcomingBorder: string;
  titleColor: string;
}

const LIFECYCLE_STAGES: readonly ApplicationStatus[] = [
  "submitted",
  "under_review",
  "interviewing",
  "offered",
  "hired",
];

const STAGE_CONFIGS: Record<ApplicationStatus, StageVisualConfig> = {
  submitted: {
    color: "#8a8a91",
    activeRing: "#f1f1f3",
    upcomingBg: "#f4f4f5",
    upcomingBorder: "#8a8a91",
    titleColor: "#3d3d42",
  },
  under_review: {
    color: "#2a55a8",
    activeRing: "#e0e9fa",
    upcomingBg: "#eef4ff",
    upcomingBorder: "#2a55a8",
    titleColor: "#2a55a8",
  },
  interviewing: {
    color: "#6941c6",
    activeRing: "#efe9fb",
    upcomingBg: "#fbf9ff",
    upcomingBorder: "#6941c6",
    titleColor: "#6941c6",
  },
  offered: {
    color: "#b45309",
    activeRing: "#fef3c7",
    upcomingBg: "#fcf3e3",
    upcomingBorder: "#b45309",
    titleColor: "#9a4a06",
  },
  hired: {
    color: "#12764a",
    activeRing: "#d1fae5",
    upcomingBg: "#e8f5ee",
    upcomingBorder: "#12764a",
    titleColor: "#12764a",
  },
  rejected: {
    color: "#dc2626",
    activeRing: "#fee2e2",
    upcomingBg: "#fef2f2",
    upcomingBorder: "#dc2626",
    titleColor: "#dc2626",
  },
  withdrawn: {
    color: "#64646b",
    activeRing: "#ecebe7",
    upcomingBg: "#f5f5f4",
    upcomingBorder: "#64646b",
    titleColor: "#64646b",
  },
  position_filled: {
    color: "#64646b",
    activeRing: "#ecebe7",
    upcomingBg: "#f5f5f4",
    upcomingBorder: "#64646b",
    titleColor: "#64646b",
  },
};

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

  if (isTerminalNegative) {
    const latestDate = statusHistory[0]?.occurredAt || statusHistory[0]?.timestamp;
    const formattedDate = latestDate ? formatDate(latestDate, locale) : null;
    return (
      <section
        aria-label="Progress"
        className={cn(
          "flex items-center gap-3 px-[22px] py-4 rounded-xl bg-card border border-border text-[13.5px] text-muted-foreground",
          className,
        )}
      >
        <span className="size-[22px] rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
          <X className="size-3 stroke-[3]" />
        </span>
        <span>
          <strong className="font-bold text-foreground">
            {t(`applications.status.${currentStatus}`)}
          </strong>
          {formattedDate ? ` · ${formattedDate}` : ""}
        </span>
      </section>
    );
  }

  // Map each status to its recorded timestamp
  const historyDates = statusHistory.reduce<Record<string, string>>((acc, item) => {
    const ts = item.occurredAt || item.timestamp;
    if (ts && !acc[item.status]) {
      acc[item.status] = ts;
    }
    return acc;
  }, {});

  const activeIndex = LIFECYCLE_STAGES.indexOf(currentStatus);

  return (
    <section
      aria-label="Progress"
      className={cn(
        "flex items-center px-[22px] py-4 rounded-xl bg-card border border-border overflow-x-auto",
        className,
      )}
    >
      {LIFECYCLE_STAGES.map((stage, idx) => {
        const isPassed = activeIndex !== -1 && idx < activeIndex;
        const isCurrent = idx === activeIndex;
        const isUpcoming = activeIndex === -1 || idx > activeIndex;

        const stageConfig = STAGE_CONFIGS[stage];
        const rawDate = historyDates[stage];
        const formattedDate = rawDate ? formatShortDate(rawDate, locale) : null;

        const isLast = idx === LIFECYCLE_STAGES.length - 1;
        const nextStage = !isLast ? LIFECYCLE_STAGES[idx + 1] : null;
        const nextStageConfig = nextStage ? STAGE_CONFIGS[nextStage] : null;

        const isPassedLine = activeIndex !== -1 && idx < activeIndex;

        return (
          <React.Fragment key={stage}>
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Stage indicator circle (24px / size-6) */}
              {isPassed ? (
                <span
                  className="size-6 rounded-full flex items-center justify-center shrink-0 text-white"
                  style={{ backgroundColor: stageConfig.color }}
                >
                  <Check className="size-3 stroke-[3]" />
                </span>
              ) : isCurrent ? (
                <span
                  className="size-6 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: stageConfig.color,
                    boxShadow: `0 0 0 4px ${stageConfig.activeRing}`,
                  }}
                >
                  <span className="size-2 rounded-full bg-white" />
                </span>
              ) : (
                <span
                  className="size-6 rounded-full shrink-0 border-2"
                  style={{
                    backgroundColor: stageConfig.upcomingBg,
                    borderColor: stageConfig.upcomingBorder,
                    opacity: 0.55,
                  }}
                />
              )}

              {/* Stage title and date text */}
              <div className="flex flex-col gap-px">
                <span
                  className={cn(
                    "text-[13.5px] font-bold whitespace-nowrap",
                    isUpcoming && "opacity-60",
                  )}
                  style={{ color: stageConfig.titleColor }}
                >
                  {t(`applications.status.${stage}`)}
                </span>
                {formattedDate ? (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {isCurrent
                      ? t("recruiterApplications.detail.since", { date: formattedDate })
                      : formattedDate}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Connecting line to next stage */}
            {!isLast && nextStageConfig ? (
              <span
                className={cn(
                  "flex-grow h-0.5 mx-3 min-w-8",
                  !isPassedLine && "bg-border",
                )}
                style={
                  isPassedLine
                    ? {
                        background: `linear-gradient(90deg, ${stageConfig.color}, ${nextStageConfig.color})`,
                      }
                    : undefined
                }
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </section>
  );
}
