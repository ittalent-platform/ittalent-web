import { Briefcase, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";

import { AdminPageHeader } from "@/components/common/admin-page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ListToolbar } from "@/components/common/list-toolbar";
import { SearchEmptyState } from "@/components/common/search-empty-state";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TableSkeletonRows,
} from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import { cn } from "@/lib/utils";

import { jobPostingErrorMessage } from "./job-posting-errors";
import { JobPostingStatusBadge } from "./job-posting-status-badge";
import {
  ALL_OPTION,
  DEFAULT_SORT,
  JOB_EMPLOYMENT_TYPES,
  JOB_LEVELS,
  JOB_LIST_DEFAULT_LIMIT,
  JOB_POSTINGS_PATH,
  JOB_PUBLICATION_STATUSES,
  JOB_SEARCH_PATTERN,
  LIST_PARAMS,
  SKELETON_ROW_COUNT,
} from "./job-postings.constants";
import {
  formatDeadline,
  formatPostedDate,
  jobDisplayId,
} from "./job-postings.format";
import {
  useJobPostingList,
  type JobPostingListParams,
} from "./job-postings.queries";

const headerCell =
  "px-3.5 py-3 text-[11.5px] font-bold tracking-[0.06em] text-muted-foreground uppercase whitespace-nowrap";
const bodyCell = "px-3.5 py-4 align-middle text-[13.5px] text-foreground";
const COLUMN_COUNT = 7;

/** Enterprise admin view of the company's job postings (UC-JOB-04@EntAdmin): read-only, no create or lifecycle actions. */
export function JobPostingReadOnlyListPage({
  companyName,
}: {
  companyName?: string | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [now] = useState(() => Date.now());
  const { page, limit, search, debouncedSearch, set, setMany } = useListParams(
    { defaultLimit: JOB_LIST_DEFAULT_LIMIT },
  );

  const type = searchParams.get(LIST_PARAMS.type) ?? ALL_OPTION;
  const level = searchParams.get(LIST_PARAMS.level) ?? ALL_OPTION;
  const requestedStatus = searchParams.get(LIST_PARAMS.publicationStatus);
  const status = JOB_PUBLICATION_STATUSES.find((s) => s === requestedStatus);
  const hasFilters =
    search !== "" || type !== ALL_OPTION || level !== ALL_OPTION || !!status;
  const isSearchValid = JOB_SEARCH_PATTERN.test(search);

  const params: JobPostingListParams = {
    page,
    limit,
    sort_by: DEFAULT_SORT.by,
    sort_order: DEFAULT_SORT.order,
    ...(isSearchValid && debouncedSearch ? { search: debouncedSearch } : {}),
    ...(type !== ALL_OPTION ? { employment_type: type } : {}),
    ...(level !== ALL_OPTION ? { level } : {}),
    ...(status ? { publication_status: status } : {}),
  };
  const query = useJobPostingList("recruiter", params);
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const company = companyName ?? items[0]?.enterprise.name ?? "";

  const clearFilters = () =>
    setMany({
      search: null,
      [LIST_PARAMS.type]: null,
      [LIST_PARAMS.level]: null,
      [LIST_PARAMS.publicationStatus]: null,
    });

  const filter = (
    label: string,
    param: string,
    value: string,
    options: { label: string; value: string }[],
  ) => (
    <FilterSelect
      onChange={(next) => set(param, next === ALL_OPTION ? null : next)}
      options={[{ label: t("jobPostings.toolbar.all"), value: ALL_OPTION }, ...options]}
      placeholder={t("jobPostings.toolbar.all")}
      renderTrigger={(selectedLabel) => (
        <span>
          {label}:{" "}
          <span className="font-semibold text-foreground">{selectedLabel}</span>
        </span>
      )}
      value={value}
    />
  );

  const subtitle = query.isPending
    ? undefined
    : hasFilters
      ? t("jobPostings.enterpriseAdmin.subtitleFiltered", { count: total })
      : total === 0
        ? t("jobPostings.enterpriseAdmin.subtitleEmpty", { company })
        : t("jobPostings.enterpriseAdmin.subtitle", { count: total, company });

  return (
    <div className="space-y-5">
      <AdminPageHeader description={subtitle} title={t("jobPostings.title")} />

      <ListToolbar
        onSearchChange={(value) => set("search", value)}
        search={search}
        searchError={
          !isSearchValid && search ? t("jobPostings.search.validation") : undefined
        }
        searchPlaceholder={t("jobPostings.searchPlaceholder")}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {filter(
            t("jobPostings.status"),
            LIST_PARAMS.publicationStatus,
            status ?? ALL_OPTION,
            JOB_PUBLICATION_STATUSES.map((value) => ({
              label: t(`jobPostings.publicationStatus.${value}`),
              value,
            })),
          )}
          {filter(
            t("jobPostings.toolbar.type"),
            LIST_PARAMS.type,
            type,
            JOB_EMPLOYMENT_TYPES.map((value) => ({
              label: t(`jobPostings.employmentTypes.${value}`),
              value,
            })),
          )}
          {filter(
            t("jobPostings.toolbar.level"),
            LIST_PARAMS.level,
            level,
            JOB_LEVELS.map((value) => ({ label: value, value })),
          )}
          {hasFilters ? (
            <Button
              className="h-11 px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
              type="button"
              variant="ghost"
            >
              {t("jobPostings.toolbar.clear")}
            </Button>
          ) : null}
        </div>
      </ListToolbar>

      {query.isError ? (
        <ErrorState
          description={jobPostingErrorMessage(query.error, t)}
          onRetry={() => void query.refetch()}
          title={t("jobPostings.loadFailed")}
        />
      ) : !query.isPending && items.length === 0 ? (
        hasFilters ? (
          <SearchEmptyState
            description={t("jobPostings.search.noResultsDescription")}
            icon={Briefcase}
            onClear={clearFilters}
            title={t("jobPostings.search.noResultsTitle", { query: search })}
          />
        ) : (
          <EmptyState
            description={t("jobPostings.enterpriseAdmin.emptyDescription")}
            icon={Briefcase}
            title={t("jobPostings.empty.title")}
          />
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table className="w-full">
            <TableHead className="bg-(--table-header-bg) dark:bg-muted/40 border-b border-border">
              <TableHeaderRow className="hover:bg-transparent h-11">
                <TableHeaderCell className={`${headerCell} min-w-[260px] pl-5`}>
                  {t("jobPostings.table.job")}
                </TableHeaderCell>
                <TableHeaderCell className={headerCell}>
                  {t("jobPostings.table.status")}
                </TableHeaderCell>
                <TableHeaderCell className={headerCell}>
                  {t("jobPostings.table.deadline")}
                </TableHeaderCell>
                <TableHeaderCell className={headerCell}>
                  {t("jobPostings.table.applications")}
                </TableHeaderCell>
                <TableHeaderCell className={headerCell}>
                  {t("jobPostings.detail.created")}
                </TableHeaderCell>
                <TableHeaderCell className={headerCell}>
                  {t("jobPostings.enterpriseAdmin.published")}
                </TableHeaderCell>
                <TableHeaderCell className="w-10 pr-4">
                  <span className="sr-only">{t("jobPostings.table.actions")}</span>
                </TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {query.isPending ? (
                <TableSkeletonRows columns={COLUMN_COUNT} rows={SKELETON_ROW_COUNT} />
              ) : (
                items.map((row) => {
                  const detailPath = `${JOB_POSTINGS_PATH}/${row.id}`;
                  const isArchived = row.status === "archived";
                  const isExpired =
                    !isArchived &&
                    !!row.expiresAt &&
                    new Date(row.expiresAt).getTime() < now;
                  const count = row.applicationCount ?? 0;
                  return (
                    <TableRow
                      className="cursor-pointer border-t border-border/70 transition-colors hover:bg-muted/20"
                      key={row.id}
                      onClick={() => navigate(detailPath)}
                    >
                      <TableCell className={`${bodyCell} pl-5`}>
                        <Link
                          className="flex min-w-0 flex-col gap-0.5 no-underline"
                          onClick={(event) => event.stopPropagation()}
                          to={detailPath}
                        >
                          <span
                            className={cn(
                              "truncate text-[14px] font-bold hover:text-fg-link",
                              isArchived ? "text-muted-foreground" : "text-foreground",
                            )}
                          >
                            {row.title}
                          </span>
                          <span className="truncate text-[13px] text-muted-foreground">
                            {[jobDisplayId(row.id), row.location]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className={`${bodyCell} whitespace-nowrap`}>
                        <JobPostingStatusBadge mode="publication" posting={row} />
                      </TableCell>
                      <TableCell className={`${bodyCell} whitespace-nowrap`}>
                        {!row.expiresAt ? (
                          <span className="text-muted-foreground">—</span>
                        ) : isExpired ? (
                          <span className="flex flex-col gap-0.5">
                            <span className="font-semibold text-destructive">
                              {formatDeadline(row.expiresAt)}
                            </span>
                            <span className="text-[12px] text-muted-foreground">
                              {t("jobPostings.actions.deadlinePassed")}
                            </span>
                          </span>
                        ) : (
                          <span className={cn(isArchived && "text-muted-foreground")}>
                            {formatDeadline(row.expiresAt)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          bodyCell,
                          "tabular-nums",
                          count > 0 ? "font-semibold" : "text-muted-foreground",
                        )}
                      >
                        {count}
                      </TableCell>
                      <TableCell className={`${bodyCell} whitespace-nowrap`}>
                        {formatPostedDate(row.createdAt)}
                      </TableCell>
                      <TableCell className={`${bodyCell} whitespace-nowrap`}>
                        {row.publishedAt ? (
                          formatPostedDate(row.publishedAt)
                        ) : (
                          <span className="text-muted-foreground">
                            {t("jobPostings.enterpriseAdmin.notPublished")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4 text-right align-middle text-muted-foreground">
                        <ChevronRight aria-hidden="true" className="ml-auto size-4" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {total > 0 ? (
        <Pagination
          limit={limit}
          onLimitChange={(value) => setMany({ limit: String(value), page: "1" })}
          onPageChange={(value) => set("page", String(value))}
          page={page}
          total={total}
          totalPages={query.data?.totalPages ?? 1}
        />
      ) : null}
    </div>
  );
}
