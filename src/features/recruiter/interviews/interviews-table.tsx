import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { PersonAvatar } from "@/components/common/person-avatar";

import { InterviewModeBadge, InterviewStatusBadge } from "./interview-badges";
import { INTERVIEW_SKELETON_ROWS, type InterviewItem, type InterviewSortOrder } from "./interviews.constants";
import { formatShortDay, formatTimeRange, initialsName } from "./interviews.format";

const DATE_COLUMN = "dateTime";

type InterviewsTableProps = {
  emptyState: ReactNode;
  isLoading: boolean;
  items: InterviewItem[];
  onSort: () => void;
  sortOrder: InterviewSortOrder;
};

/** The applicant's name, or the email when the account has no name. */
export function applicantName(interview: InterviewItem): string {
  return interview.applicant.fullName?.trim() || interview.applicant.email || "—";
}

/** Where the interview takes place: the room link for an online one, the address for an onsite one. */
function Place({ interview }: { interview: InterviewItem }) {
  if (interview.mode === "onsite") {
    return <span className="block max-w-[220px] truncate" title={interview.location ?? undefined}>{interview.location ?? "—"}</span>;
  }
  if (!interview.meetingLink) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      className="block max-w-[200px] truncate text-fg-link underline-offset-2 hover:underline"
      href={interview.meetingLink}
      onClick={(event) => event.stopPropagation()}
      rel="noreferrer"
      target="_blank"
      title={interview.meetingLink}
    >
      {interview.meetingLink.replace(/^https?:\/\//, "")}
    </a>
  );
}

export function InterviewsTable({ emptyState, isLoading, items, onSort, sortOrder }: InterviewsTableProps) {
  const { t, i18n } = useTranslation();

  const columns: DataTableColumn<InterviewItem>[] = [
    {
      cell: (interview) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <PersonAvatar className="size-9 text-[13px]" name={initialsName(applicantName(interview))} tone="peach" />
          <span className="truncate font-bold text-foreground">{applicantName(interview)}</span>
        </div>
      ),
      className: "min-w-[220px]",
      header: t("interviews.table.applicant"),
      key: "applicant",
    },
    {
      cell: (interview) => (
        <span className="block max-w-[170px] truncate text-muted-foreground" title={interview.job.title ?? undefined}>
          {interview.job.title ?? "—"}
        </span>
      ),
      header: t("interviews.table.job"),
      key: "job",
    },
    {
      cell: (interview) => (
        <div className="flex flex-col leading-snug">
          <span>{formatShortDay(interview.scheduledAt, i18n.language)}</span>
          <span className="text-[12.5px] text-muted-foreground">{formatTimeRange(interview.scheduledAt, interview.endsAt, i18n.language)}</span>
        </div>
      ),
      className: "whitespace-nowrap",
      header: t("interviews.table.dateTime"),
      key: DATE_COLUMN,
      sortable: true,
    },
    { cell: (interview) => <InterviewModeBadge mode={interview.mode} />, header: t("interviews.table.mode"), key: "mode" },
    { cell: (interview) => <Place interview={interview} />, header: t("interviews.table.location"), key: "location" },
    { cell: (interview) => <InterviewStatusBadge status={interview.status} />, header: t("interviews.table.status"), key: "status" },
  ];

  return (
    <DataTable<InterviewItem>
      columns={columns}
      emptyState={emptyState}
      isLoading={isLoading}
      onSort={onSort}
      rowKey={(interview) => interview.id}
      rows={items}
      skeletonRows={INTERVIEW_SKELETON_ROWS}
      sort={{ direction: sortOrder, key: DATE_COLUMN }}
    />
  );
}
