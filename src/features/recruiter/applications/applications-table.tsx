import { ExternalLink, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { PersonAvatar } from "@/components/common/person-avatar";
import {
  SortableHeaderButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ApplicationRowActions } from "./application-row-actions";
import {
  INTERVIEW_REPLY_TONES,
  RECRUITER_APPLICATIONS_PATH,
  STATUS_TONES,
  type ApplicationItem,
  type ApplicationStatus,
  type InterviewReplyState,
  type SortField,
  type SortOrder,
} from "./applications.constants";
import { candidateDisplayName, formatDate, formatInterviewSchedule } from "./applications.format";

export interface ApplicationsTableProps {
  items: ApplicationItem[];
  locale: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onStatusChange?: (item: ApplicationItem, status: ApplicationStatus) => void;
  onScheduleInterview?: (item: ApplicationItem) => void;
  onOpenCv?: (item: ApplicationItem) => void;
  onDownloadCv?: (item: ApplicationItem) => void;
}

export function ApplicationsTable({
  items,
  locale,
  sortBy,
  sortOrder,
  onSort,
  onStatusChange,
  onScheduleInterview,
  onOpenCv,
  onDownloadCv,
}: ApplicationsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Table className="w-full table-fixed">
      <TableHead>
        <TableHeaderRow>
          <TableHeaderCell className="w-[23%] pl-5">
            <SortableHeaderButton
              active={sortBy === "id"}
              className="text-foreground hover:text-foreground"
              direction={sortBy === "id" ? sortOrder : null}
              label={t("recruiterApplications.columns.candidate")}
              onClick={() => onSort("id")}
            />
          </TableHeaderCell>
          <TableHeaderCell className="w-[18%]">
            {t("recruiterApplications.columns.job")}
          </TableHeaderCell>
          <TableHeaderCell className="w-[10%]">
            <SortableHeaderButton
              active={sortBy === "submittedAt"}
              className="font-bold text-foreground hover:text-foreground"
              direction={sortBy === "submittedAt" ? sortOrder : null}
              label={t("recruiterApplications.columns.submitted")}
              onClick={() => onSort("submittedAt")}
            />
          </TableHeaderCell>
          <TableHeaderCell className="w-[25%]">
            {t("recruiterApplications.columns.documents")}
          </TableHeaderCell>
          <TableHeaderCell className="w-[13%]">
            <SortableHeaderButton
              active={sortBy === "latestStatusAt"}
              className="text-foreground hover:text-foreground"
              direction={sortBy === "latestStatusAt" ? sortOrder : null}
              label={t("recruiterApplications.columns.nextInterview")}
              onClick={() => onSort("latestStatusAt")}
            />
          </TableHeaderCell>
          <TableHeaderCell className="w-[8%]">
            {t("recruiterApplications.columns.status")}
          </TableHeaderCell>
          <TableHeaderCell className="w-[3%] pr-5 text-right">
            <span className="sr-only">{t("recruiterApplications.columns.actions")}</span>
          </TableHeaderCell>
        </TableHeaderRow>
      </TableHead>
      <TableBody>
        {items.map((item) => {
          const detailPath = `${RECRUITER_APPLICATIONS_PATH}/${item.id}`;
          const candidateName = candidateDisplayName(item.applicant);
          const hasCv = item.submittedDocuments.includes("cv");
          const hasCoverLetter = item.submittedDocuments.includes("cover_letter");
          const replyState: InterviewReplyState = "awaiting_reply";
          const replyTone = INTERVIEW_REPLY_TONES[replyState];

          return (
            <TableRow
              className="group cursor-pointer hover:bg-surface-subtle"
              key={item.id}
              onClick={() => navigate(detailPath)}
            >
              <TableCell className="w-[23%] pl-5">
                <div className="flex min-w-0 items-center gap-3">
                  <PersonAvatar className="size-9 shrink-0 text-xs" name={candidateName} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Link
                        className="truncate text-[13.5px] font-semibold text-foreground group-hover:underline"
                        onClick={(e) => e.stopPropagation()}
                        title={candidateName}
                        to={detailPath}
                      >
                        {candidateName}
                      </Link>
                      {item.notesCount > 0 ? (
                        <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          {t("recruiterApplications.candidate.appliedAgain")}
                        </span>
                      ) : null}
                    </div>
                    <span
                      className="truncate text-[12.5px] text-muted-foreground"
                      title={item.applicant.email}
                    >
                      {item.applicant.email}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell className="w-[18%]">
                <span
                  className="block truncate text-[13.5px] font-medium text-foreground"
                  title={item.job.title}
                >
                  {item.job.title}
                </span>
              </TableCell>

              <TableCell className="w-[10%] whitespace-nowrap text-[13px] text-foreground">
                {formatDate(item.submittedAt, locale)}
              </TableCell>

              <TableCell className="w-[25%]">
                <div
                  className="flex items-center gap-1.5 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  {hasCv ? (
                    <button
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                      onClick={() => onOpenCv?.(item)}
                      type="button"
                    >
                      <FileText className="size-3.5 text-muted-foreground" />
                      <span>{t("recruiterApplications.document.cv")}</span>
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </button>
                  ) : null}
                  {hasCoverLetter ? (
                    <button
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                      onClick={() => onOpenCv?.(item)}
                      type="button"
                    >
                      <FileText className="size-3.5 text-muted-foreground" />
                      <span>{t("recruiterApplications.document.cover_letter")}</span>
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </button>
                  ) : null}
                  {!hasCv && !hasCoverLetter ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : null}
                </div>
              </TableCell>

              <TableCell className="w-[13%]">
                {item.nextInterview ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="whitespace-nowrap text-[13px] font-medium text-foreground">
                      {formatInterviewSchedule(item.nextInterview.scheduledAt, locale)}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn("size-1.5 rounded-full", replyTone.dot)} />
                      {t(`recruiterApplications.interviewReply.${replyState}`)}
                    </span>
                  </div>
                ) : (
                  <span className="text-[13px] text-muted-foreground">—</span>
                )}
              </TableCell>

              <TableCell className="w-[8%]">
                <span
                  className={cn(
                    "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    STATUS_TONES[item.status]?.badge,
                  )}
                >
                  {t(`applications.status.${item.status}`)}
                </span>
              </TableCell>

              <TableCell className="w-[3%] pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                <ApplicationRowActions
                  item={item}
                  onDownloadCv={() => onDownloadCv?.(item)}
                  onOpenCv={() => onOpenCv?.(item)}
                  onScheduleInterview={() => onScheduleInterview?.(item)}
                  onStatusChange={(status) => onStatusChange?.(item, status)}
                  onView={() => navigate(detailPath)}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
