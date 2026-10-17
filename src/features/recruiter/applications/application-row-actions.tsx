import {
  ArrowRight,
  Calendar,
  Download,
  ExternalLink,
  Eye,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  PERMITTED_TRANSITIONS,
  STATUS_TONES,
  type ApplicationItem,
  type ApplicationStatus,
} from "./applications.constants";

export interface ApplicationRowActionsProps {
  item: ApplicationItem;
  onView: () => void;
  onStatusChange?: (status: ApplicationStatus) => void;
  onScheduleInterview?: () => void;
  onOpenCv?: () => void;
  onDownloadCv?: () => void;
}

export function ApplicationRowActions({
  item,
  onView,
  onStatusChange,
  onScheduleInterview,
  onOpenCv,
  onDownloadCv,
}: ApplicationRowActionsProps) {
  const { t } = useTranslation();
  const hasCv = item.submittedDocuments.includes("cv");
  const nextStatuses = PERMITTED_TRANSITIONS[item.status] ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t("recruiterApplications.columns.actions")}
          className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          size="icon"
          variant="ghost"
        >
          <MoreHorizontal aria-hidden className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl py-1">
        <DropdownMenuItem className="gap-2.5 px-3.5 py-2 text-[13.5px]" onSelect={onView}>
          <Eye className="size-4 text-muted-foreground" />
          {t("recruiterApplications.actions.viewApplication")}
        </DropdownMenuItem>

        {hasCv ? (
          <>
            <DropdownMenuItem
              className="gap-2.5 px-3.5 py-2 text-[13.5px]"
              onSelect={onOpenCv ?? onView}
            >
              <ExternalLink className="size-4 text-muted-foreground" />
              {t("recruiterApplications.actions.openCv")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2.5 px-3.5 py-2 text-[13.5px]"
              onSelect={onDownloadCv ?? onView}
            >
              <Download className="size-4 text-muted-foreground" />
              {t("recruiterApplications.actions.downloadCv")}
            </DropdownMenuItem>
          </>
        ) : null}

        {nextStatuses.length > 0 && onStatusChange ? (
          <>
            {nextStatuses.map((nextStatus) => {
              const tone = STATUS_TONES[nextStatus];
              const isReject = nextStatus === "rejected";
              return (
                <DropdownMenuItem
                  className={cn("gap-2.5 px-3.5 py-2 text-[13.5px] font-medium", tone.text)}
                  key={nextStatus}
                  onSelect={() => onStatusChange(nextStatus)}
                >
                  {isReject ? (
                    <XCircle className="size-4 shrink-0 text-(--status-error-fg)" />
                  ) : (
                    <ArrowRight className={cn("size-4 shrink-0", tone.text)} />
                  )}
                  {t("recruiterApplications.actions.moveTo", {
                    stage: t(`applications.status.${nextStatus}`),
                  })}
                </DropdownMenuItem>
              );
            })}
          </>
        ) : null}

        {onScheduleInterview ? (
          <DropdownMenuItem
            className="gap-2.5 px-3.5 py-2 text-[13.5px]"
            onSelect={onScheduleInterview}
          >
            <Calendar className="size-4 text-muted-foreground" />
            {t("recruiterApplications.actions.scheduleInterview")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
