import type { DragEvent } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Calendar, ExternalLink, FileText } from "lucide-react";

import { PersonAvatar } from "@/components/common/person-avatar";
import { cn } from "@/lib/utils";
import {
  RECRUITER_APPLICATIONS_PATH,
  isKanbanDraggable,
  type ApplicationItem,
} from "./applications.constants";
import {
  candidateDisplayName,
  formatInterviewSchedule,
  formatShortDate,
} from "./applications.format";

export interface ApplicationKanbanCardProps {
  application: ApplicationItem;
  locale: string;
  isDragging?: boolean;
  onDragStart?: (event: DragEvent<HTMLDivElement>, item: ApplicationItem) => void;
  onDragEnd?: (event: DragEvent<HTMLDivElement>) => void;
  onOpenCv?: (item: ApplicationItem) => void;
  onOpenCoverLetter?: (item: ApplicationItem) => void;
}

export function ApplicationKanbanCard({
  application,
  locale,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onOpenCv,
  onOpenCoverLetter,
}: ApplicationKanbanCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const candidateName = candidateDisplayName(application.applicant);
  const detailPath = `${RECRUITER_APPLICATIONS_PATH}/${application.id}`;
  const draggable = isKanbanDraggable(application.status);
  const hasCv = application.submittedDocuments.includes("cv");
  const hasCoverLetter = application.submittedDocuments.includes("cover_letter");

  return (
    <div
      aria-grabbed={isDragging}
      aria-label={`${candidateName} - ${application.job.title}`}
      className={cn(
        "group flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5 shadow-xs transition-all duration-150 select-none",
        draggable
          ? "cursor-grab active:cursor-grabbing hover:border-(--border-strong) hover:shadow-sm"
          : "cursor-pointer hover:border-(--border-strong)",
        isDragging && "opacity-40 ring-2 ring-primary ring-offset-2",
      )}
      draggable={draggable}
      onClick={() => navigate(detailPath)}
      onDragEnd={onDragEnd}
      onDragStart={(e) => onDragStart?.(e, application)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-2.5">
        <PersonAvatar className="size-7 shrink-0 text-xs font-semibold" name={candidateName} />
        <span
          className="truncate text-[13.5px] font-semibold text-foreground group-hover:underline"
          title={candidateName}
        >
          {candidateName}
        </span>
      </div>

      <div className="flex flex-col">
        <span
          className="line-clamp-1 text-[13px] font-medium text-foreground"
          title={application.job.title}
        >
          {application.job.title}
        </span>
        <span
          className="line-clamp-1 text-xs text-muted-foreground"
          title={application.applicant.email}
        >
          {application.applicant.email}
        </span>
      </div>

      {application.nextInterview ? (
        <div className="inline-flex w-fit items-center gap-1.5 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
          <Calendar aria-hidden className="size-3 text-purple-600 dark:text-purple-400" />
          <span>
            {t("recruiterApplications.card.interviewPrefix", "Interview")}{" "}
            {formatInterviewSchedule(application.nextInterview.scheduledAt, locale)}
          </span>
        </div>
      ) : null}

      <div className="mt-1 flex items-center justify-between gap-2 pt-1 border-t border-border/40">
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {hasCv ? (
            <button
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-2xs hover:bg-muted"
              onClick={() => onOpenCv?.(application)}
              type="button"
            >
              <FileText className="size-3 text-muted-foreground" />
              <span>{t("recruiterApplications.document.cv", "CV")}</span>
              <ExternalLink className="size-2.5 text-muted-foreground" />
            </button>
          ) : null}

          {hasCoverLetter ? (
            <button
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-2xs hover:bg-muted"
              onClick={() => onOpenCoverLetter?.(application)}
              type="button"
            >
              <FileText className="size-3 text-muted-foreground" />
              <span>{t("recruiterApplications.card.letter", "Letter")}</span>
              <ExternalLink className="size-2.5 text-muted-foreground" />
            </button>
          ) : null}

          {!hasCv && !hasCoverLetter ? (
            <span className="text-[11px] text-muted-foreground">—</span>
          ) : null}
        </div>

        <span className="shrink-0 text-xs text-muted-foreground">
          {formatShortDate(application.submittedAt, locale)}
        </span>
      </div>
    </div>
  );
}
