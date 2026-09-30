import { Briefcase, Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

import type { JobPosting } from "@/api/generated/types.gen";
import { EmptyState } from "@/components/common/empty-state";
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

import { JobPostingStatusBadge } from "./job-posting-status-badge";
import {
  SKELETON_ROW_COUNT,
  type JobSortBy,
  type JobSortOrder,
} from "./job-postings.constants";
import {
  formatDeadline,
  formatSalary,
  jobDisplayId,
} from "./job-postings.format";

const headerCell =
  "px-3 py-3 text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle dark:text-muted-foreground uppercase whitespace-nowrap";
const bodyCell = "px-3 py-3 align-middle text-[13px] text-foreground";
const COLUMN_COUNT = 8;

type Props = {
  basePath: string;
  canManage: boolean;
  hasFilters: boolean;
  isLoading: boolean;
  items: JobPosting[];
  onClearFilters: () => void;
  onDelete: (posting: JobPosting) => void;
  onSort: (field: JobSortBy) => void;
  sortBy: JobSortBy;
  sortOrder: JobSortOrder;
};

export function JobPostingTable({
  basePath,
  canManage,
  hasFilters,
  isLoading,
  items,
  onClearFilters,
  onDelete,
  onSort,
  sortBy,
  sortOrder,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isLoading && items.length === 0) {
    return hasFilters ? (
      <SearchEmptyState
        description={t("jobPostings.empty.noMatchesDescription")}
        icon={Briefcase}
        onClear={onClearFilters}
        title={t("jobPostings.empty.noMatchesTitle")}
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
            ? t("jobPostings.empty.description")
            : t("jobPostings.empty.adminDescription")
        }
        icon={Briefcase}
        title={t("jobPostings.empty.title")}
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
      <TableHead className="bg-surface-readonly dark:bg-muted/40 border-b border-border">
        <TableHeaderRow className="hover:bg-transparent">
          <TableHeaderCell className={`${headerCell} w-[76px]`}>
            {sortable("created_at", t("jobPostings.table.id"))}
          </TableHeaderCell>
          <TableHeaderCell className={`${headerCell} min-w-[190px]`}>
            {sortable("title", t("jobPostings.table.job"))}
          </TableHeaderCell>
          <TableHeaderCell className={headerCell}>
            {t("jobPostings.table.typeLevel")}
          </TableHeaderCell>
          <TableHeaderCell className={headerCell}>
            {t("jobPostings.table.salary")}
          </TableHeaderCell>
          <TableHeaderCell className={headerCell}>
            {t("jobPostings.table.applications")}
          </TableHeaderCell>
          <TableHeaderCell className={headerCell}>
            {sortable("expires_at", t("jobPostings.table.deadline"))}
          </TableHeaderCell>
          <TableHeaderCell className={headerCell}>
            {t("jobPostings.table.status")}
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
            return (
              <TableRow
                className="group/row border-t border-line-muted transition-colors hover:bg-surface-subtle dark:border-border/50 dark:hover:bg-muted/20"
                key={row.id}
              >
                <TableCell className={bodyCell}>
                  <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {jobDisplayId(row.id)}
                  </span>
                </TableCell>
                <TableCell className={`${bodyCell} min-w-[190px]`}>
                  <Link
                    className="group/link flex min-w-0 flex-col no-underline"
                    to={detailPath}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[13.5px] font-bold text-foreground transition group-hover/link:text-primary">
                        {row.title}
                      </span>
                      <span className="truncate text-[12px] text-muted-foreground">
                        {[row.enterprise.name, row.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className={`${bodyCell} whitespace-nowrap`}>
                  <span className="flex flex-col">
                    <span>{row.employmentType ?? "—"}</span>
                    {row.level ? (
                      <span className="text-[12px] text-muted-foreground">
                        {row.level}
                      </span>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell className={`${bodyCell} whitespace-nowrap`}>
                  {formatSalary(row, { compact: true })}
                </TableCell>
                <TableCell className={bodyCell}>
                  <span className="font-mono text-xs">
                    {row.applicationCount ?? "—"}
                  </span>
                </TableCell>
                <TableCell className={`${bodyCell} whitespace-nowrap`}>
                  {formatDeadline(row.expiresAt)}
                </TableCell>
                <TableCell className={`${bodyCell} whitespace-nowrap`}>
                  <JobPostingStatusBadge posting={row} />
                </TableCell>
                <TableCell className="px-2 py-3 pr-3 text-right align-middle">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label={t("jobPostings.table.actionsFor", {
                          title: row.title,
                        })}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-foreground/70 transition hover:bg-muted hover:text-foreground dark:text-muted-foreground"
                        type="button"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-44 rounded-xl text-sm"
                    >
                      <DropdownMenuItem
                        className="flex cursor-pointer items-center gap-2 px-3 py-2"
                        onClick={() => navigate(detailPath)}
                      >
                        <Eye className="size-4 text-muted-foreground" />
                        <span>{t("jobPostings.table.view")}</span>
                      </DropdownMenuItem>
                      {canManage && row.status !== "archived" ? (
                        <DropdownMenuItem
                          className="flex cursor-pointer items-center gap-2 px-3 py-2"
                          onClick={() => navigate(`${detailPath}/edit`)}
                        >
                          <Pencil className="size-4 text-muted-foreground" />
                          <span>{t("jobPostings.table.edit")}</span>
                        </DropdownMenuItem>
                      ) : null}
                      {canManage ? (
                        <DropdownMenuItem
                          className="flex cursor-pointer items-center gap-2 px-3 py-2"
                          onClick={() => onDelete(row)}
                          variant="destructive"
                        >
                          <Trash2 className="size-4" />
                          <span>{t("jobPostings.table.delete")}</span>
                        </DropdownMenuItem>
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
