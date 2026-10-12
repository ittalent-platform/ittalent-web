import {
  Archive,
  Briefcase,
  Eye,
  Lock,
  MoreVertical,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

import type { JobPosting } from "@/api/generated/types.gen";
import { EmptyState } from "@/components/common/empty-state";
import { LogoTile } from "@/components/common/logo-tile";
import { SearchEmptyState } from "@/components/common/search-empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SortableHeaderButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TableSkeletonRows,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { JobPostingStatusBadge } from "./job-posting-status-badge";
import {
  SKELETON_ROW_COUNT,
  type JobSortBy,
  type JobSortOrder,
} from "./job-postings.constants";
import { formatDeadline, formatSalary } from "./job-postings.format";

const headerCell =
  "px-3.5 py-3 text-[11.5px] font-bold tracking-[0.06em] text-muted-foreground uppercase whitespace-nowrap";
const bodyCell = "px-3.5 py-3 align-middle text-[13.5px] text-foreground";
const COLUMN_COUNT = 6;

type Props = {
  basePath: string;
  canManage: boolean;
  hasFilters: boolean;
  isLoading: boolean;
  items: JobPosting[];
  onArchive?: (posting: JobPosting) => void;
  onClearFilters: () => void;
  onClose?: (posting: JobPosting) => void;
  onDelete: (posting: JobPosting) => void;
  onPublish?: (posting: JobPosting) => void;
  onReopen?: (posting: JobPosting) => void;
  onSort: (field: JobSortBy) => void;
  onUnarchive?: (posting: JobPosting) => void;
  onUnpublish?: (posting: JobPosting) => void;
  sortBy: JobSortBy;
  sortOrder: JobSortOrder;
};

export function JobPostingTable({
  basePath,
  canManage,
  hasFilters,
  isLoading,
  items,
  onArchive,
  onClearFilters,
  onClose,
  onDelete,
  onPublish,
  onReopen,
  onSort,
  onUnarchive,
  onUnpublish,
  sortBy,
  sortOrder,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());

  if (!isLoading && items.length === 0) {
    return hasFilters ? (
      <SearchEmptyState
        description={t("jobPostings.search.noResultsDescription")}
        icon={Briefcase}
        onClear={onClearFilters}
        title={t("jobPostings.search.noResultsTitle", { query: "" })}
      />
    ) : (
      <EmptyState
        action={
          canManage
            ? {
                label: t("jobPostings.create"),
                onClick: () => navigate(`${basePath}/create`),
              }
            : undefined
        }
        description={
          canManage
            ? t("jobPostings.search.firstJobDescription")
            : t("jobPostings.empty.adminDescription")
        }
        icon={Briefcase}
        title={t("jobPostings.search.firstJobTitle")}
      />
    );
  }

  const sortable = (field: JobSortBy, label: string) => (
    <SortableHeaderButton
      active={sortBy === field}
      ariaLabel={t("jobPostings.table.sortBy", { column: label })}
      direction={sortBy === field ? sortOrder : null}
      label={label}
      onClick={() => onSort(field)}
    />
  );

  return (
    <Table className="w-full">
      <TableHead className="bg-(--table-header-bg) dark:bg-muted/40 border-b border-border">
        <TableHeaderRow className="hover:bg-transparent h-11">
          <TableHeaderCell className={`${headerCell} min-w-[280px] pl-5`}>
            {sortable("title", t("jobPostings.table.job"))}
          </TableHeaderCell>
          <TableHeaderCell className={`${headerCell} w-[120px]`}>
            {t("jobPostings.table.status")}
          </TableHeaderCell>
          <TableHeaderCell className={`${headerCell} w-[150px]`}>
            {t("jobPostings.table.salary")}
          </TableHeaderCell>
          <TableHeaderCell className={`${headerCell} w-[160px]`}>
            {sortable("expires_at", t("jobPostings.table.deadline"))}
          </TableHeaderCell>
          <TableHeaderCell className={`${headerCell} w-[120px]`}>
            {t("jobPostings.table.applications")}
          </TableHeaderCell>
          <TableHeaderCell className="w-12 text-right pr-4">
            <span className="sr-only">{t("jobPostings.table.actions")}</span>
          </TableHeaderCell>
        </TableHeaderRow>
      </TableHead>
      <TableBody>
        {isLoading ? (
          <TableSkeletonRows columns={COLUMN_COUNT} rows={SKELETON_ROW_COUNT} />
        ) : (
          items.map((row) => {
            const detailPath = `${basePath}/${row.id}`;
            const hasApplications = (row.applicationCount ?? 0) > 0;
            const isExpired = row.expiresAt
              ? new Date(row.expiresAt).getTime() < now
              : false;
            const isArchived = row.status === "archived";

            return (
              <TableRow
                className="group/row min-h-[64px] border-t border-border/70 transition-colors hover:bg-muted/20"
                key={row.id}
              >
                <TableCell className={`${bodyCell} min-w-[280px] pl-5`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <LogoTile name={row.enterprise.name} size="md" />
                    <Link
                      className="group/link flex min-w-0 flex-1 flex-col no-underline"
                      to={detailPath}
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span
                          className={cn(
                            "truncate text-[14px] font-bold transition group-hover/link:text-fg-link",
                            isArchived
                              ? "text-muted-foreground"
                              : "text-foreground",
                          )}
                          title={row.title}
                        >
                          {row.title}
                        </span>
                        <span className="truncate text-[13px] text-muted-foreground">
                          {[
                            row.enterprise.name,
                            row.employmentType,
                            row.level,
                            row.location,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </Link>
                  </div>
                </TableCell>
                <TableCell className={`${bodyCell} whitespace-nowrap`}>
                  <JobPostingStatusBadge mode="publication" posting={row} />
                </TableCell>
                <TableCell
                  className={`${bodyCell} whitespace-nowrap font-semibold`}
                >
                  {row.salaryNegotiable
                    ? t("jobPostings.salaryNegotiable")
                    : formatSalary(row, { compact: true })}
                </TableCell>
                <TableCell className={`${bodyCell} whitespace-nowrap`}>
                  {row.expiresAt ? (
                    isExpired ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-destructive">
                          {formatDeadline(row.expiresAt)}
                        </span>
                        <span className="text-[12px] text-muted-foreground">
                          {t("jobPostings.actions.deadlinePassed")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-foreground">
                        {formatDeadline(row.expiresAt)}
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className={bodyCell}>
                  <span
                    className={cn(
                      "font-mono text-sm tabular-nums",
                      hasApplications
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {row.applicationCount ?? 0}
                  </span>
                </TableCell>
                <TableCell className="px-2 py-3 pr-4 text-right align-middle">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label={t("jobPostings.table.actionsFor", {
                          title: row.title,
                        })}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        type="button"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 rounded-xl p-1 text-sm shadow-xl"
                    >
                      <DropdownMenuItem
                        className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13.5px]"
                        onClick={() => navigate(detailPath)}
                      >
                        <Eye className="size-4 text-muted-foreground" />
                        <span className="flex-1">
                          {t("jobPostings.actions.viewDetails")}
                        </span>
                      </DropdownMenuItem>

                      {canManage && !isArchived ? (
                        <DropdownMenuItem
                          className="flex cursor-pointer items-center gap-2.5 border-t border-border/50 px-3 py-2 text-[13.5px]"
                          onClick={() => navigate(`${detailPath}/edit`)}
                        >
                          <Pencil className="size-4 text-muted-foreground" />
                          <span className="flex-1">
                            {t("jobPostings.actions.edit")}
                          </span>
                        </DropdownMenuItem>
                      ) : null}

                      {/* Draft actions */}
                      {canManage && row.status === "draft" ? (
                        <>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 border-t border-border/50 px-3 py-2 text-[13.5px] text-(--status-success-fg)"
                            onClick={() => onPublish?.(row)}
                          >
                            <Send className="size-4" />
                            <span className="flex-1">
                              {t("jobPostings.actions.publish")}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 border-t border-border/50 px-3 py-2 text-[13.5px] text-destructive"
                            onClick={() => onDelete(row)}
                          >
                            <Trash2 className="size-4" />
                            <span className="flex-1">
                              {t("jobPostings.actions.delete")}
                            </span>
                          </DropdownMenuItem>
                        </>
                      ) : null}

                      {/* Published actions */}
                      {canManage && row.status === "published" ? (
                        <>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 border-t border-border/50 px-3 py-2 text-[13.5px] text-destructive"
                            onClick={() => onClose?.(row)}
                          >
                            <Lock className="size-4" />
                            <span className="flex-1">
                              {t("jobPostings.actions.close")}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 border-t border-border/50 px-3 py-2 text-[13.5px]"
                            disabled={hasApplications}
                            onClick={() =>
                              !hasApplications && onUnpublish?.(row)
                            }
                          >
                            <Undo2 className="size-4 text-muted-foreground" />
                            <span className="flex-1">
                              {t("jobPostings.actions.unpublish")}
                            </span>
                            {hasApplications ? (
                              <span className="text-[11.5px] text-muted-foreground">
                                {t("jobPostings.actions.hasApplications")}
                              </span>
                            ) : null}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 border-t border-border/50 px-3 py-2 text-[13.5px] text-destructive"
                            disabled={hasApplications}
                            onClick={() => !hasApplications && onDelete(row)}
                          >
                            <Trash2 className="size-4" />
                            <span className="flex-1">
                              {t("jobPostings.actions.delete")}
                            </span>
                            {hasApplications ? (
                              <span className="text-[11.5px] text-muted-foreground">
                                {t("jobPostings.actions.hasApplications")}
                              </span>
                            ) : null}
                          </DropdownMenuItem>
                        </>
                      ) : null}

                      {/* Closed actions */}
                      {canManage && row.status === "closed" ? (
                        <>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 border-t border-border/50 px-3 py-2 text-[13.5px] text-blue-600 dark:text-blue-400"
                            disabled={isExpired}
                            onClick={() => !isExpired && onReopen?.(row)}
                          >
                            <RotateCcw className="size-4" />
                            <span className="flex-1">
                              {t("jobPostings.actions.reopen")}
                            </span>
                            {isExpired ? (
                              <span className="text-[11.5px] text-muted-foreground">
                                {t("jobPostings.actions.deadlinePassed")}
                              </span>
                            ) : null}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 border-t border-border/50 px-3 py-2 text-[13.5px] text-purple-600 dark:text-purple-400"
                            onClick={() => onArchive?.(row)}
                          >
                            <Archive className="size-4" />
                            <span className="flex-1">
                              {t("jobPostings.actions.archive")}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 border-t border-border/50 px-3 py-2 text-[13.5px] text-destructive"
                            disabled={hasApplications}
                            onClick={() => !hasApplications && onDelete(row)}
                          >
                            <Trash2 className="size-4" />
                            <span className="flex-1">
                              {t("jobPostings.actions.delete")}
                            </span>
                            {hasApplications ? (
                              <span className="text-[11.5px] text-muted-foreground">
                                {t("jobPostings.actions.hasApplications")}
                              </span>
                            ) : null}
                          </DropdownMenuItem>
                        </>
                      ) : null}

                      {/* Archived actions */}
                      {canManage && isArchived ? (
                        <>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 border-t border-border/50 px-3 py-2 text-[13.5px] text-purple-600 dark:text-purple-400"
                            onClick={() => onUnarchive?.(row)}
                          >
                            <RotateCcw className="size-4" />
                            <span className="flex-1">
                              {t("jobPostings.actions.unarchive")}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 border-t border-border/50 px-3 py-2 text-[13.5px] text-destructive"
                            disabled={hasApplications}
                            onClick={() => !hasApplications && onDelete(row)}
                          >
                            <Trash2 className="size-4" />
                            <span className="flex-1">
                              {t("jobPostings.actions.delete")}
                            </span>
                            {hasApplications ? (
                              <span className="text-[11.5px] text-muted-foreground">
                                {t("jobPostings.actions.hasApplications")}
                              </span>
                            ) : null}
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
