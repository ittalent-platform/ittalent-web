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
    <Table className="min-w-[960px]">
      <TableHead>
        <TableHeaderRow>
          <TableHeaderCell className="w-[300px]">
            <SortableHeaderButton
              active={sortBy === "id"}
              direction={sortBy === "id" ? sortOrder : null}
              label={t("recruiterApplications.columns.candidate")}
              onClick={() => onSort("id")}
            />
          </TableHeaderCell>
          <TableHeaderCell className="w-[200px]">
            {t("recruiterApplications.columns.job")}
          </TableHeaderCell>
          <TableHeaderCell className="w-[140px]">
            <SortableHeaderButton
              active={sortBy === "submittedAt"}
              direction={sortBy === "submittedAt" ? sortOrder : null}
              label={t("recruiterApplications.columns.submitted")}
              onClick={() => onSort("submittedAt")}
            />
          </TableHeaderCell>
          <TableHeaderCell className="w-[150px]">
            {t("recruiterApplications.columns.documents")}
          </TableHeaderCell>
          <TableHeaderCell className="w-[180px]">
            <SortableHeaderButton
              active={sortBy === "latestStatusAt"}
              direction={sortBy === "latestStatusAt" ? sortOrder : null}
              label={t("recruiterApplications.columns.nextInterview")}
              onClick={() => onSort("latestStatusAt")}
            />
          </TableHeaderCell>
          <TableHeaderCell className="w-[140px]">
            {t("recruiterApplications.columns.status")}
          </TableHeaderCell>
          <TableHeaderCell className="w-[60px] text-right">
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
              <TableCell className="max-w-[300px]">
                <div className="flex items-center gap-3">
                  <PersonAvatar className="size-9 text-xs" name={candidateName} />
                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-1.5">
                      <Link
                        className="truncate text-[13.5px] font-semibold text-foreground group-hover:underline"
                        onClick={(e) => e.stopPropagation()}
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
                    <span className="truncate text-[12.5px] text-muted-foreground">
                      {item.applicant.email}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell className="max-w-[200px]">
                <span className="truncate text-[13.5px] font-medium text-foreground">
                  {item.job.title}
                </span>
              </TableCell>

              <TableCell className="whitespace-nowrap text-[13px] text-foreground">
                {formatDate(item.submittedAt, locale)}
              </TableCell>

              <TableCell>
                <div
                  className="flex flex-wrap items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {hasCv ? (
                    <button
                      className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
                      onClick={() => onOpenCv?.(item)}
                      type="button"
                    >
                      {t("recruiterApplications.document.cv")}{" "}
                      <span aria-hidden="true" className="text-[11px]">
                        ↗
                      </span>
                    </button>
                  ) : null}
                  {hasCoverLetter ? (
                    <span className="inline-flex items-center text-xs font-semibold text-primary">
                      {t("recruiterApplications.document.cover_letter")}
                    </span>
                  ) : null}
                  {!hasCv && !hasCoverLetter ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : null}
                </div>
              </TableCell>

              <TableCell>
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

              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    STATUS_TONES[item.status]?.badge,
                  )}
                >
                  {t(`applications.status.${item.status}`)}
                </span>
              </TableCell>

              <TableCell className="w-[60px] text-right" onClick={(e) => e.stopPropagation()}>
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
