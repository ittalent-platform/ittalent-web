import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

import type { JobPosting } from "@/api/generated/types.gen";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { ListToolbar } from "@/components/common/list-toolbar";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Pagination } from "@/components/ui/pagination";
import { useListParams } from "@/hooks/use-list-params";

import { JobPostingTable } from "./job-posting-table";
import { jobPostingErrorMessage } from "./job-posting-errors";
import {
  ALL_OPTION,
  DEFAULT_SORT,
  JOB_EMPLOYMENT_TYPES,
  JOB_LEVELS,
  JOB_LIST_DEFAULT_LIMIT,
  LIST_PARAMS,
  type JobSortBy,
  type JobSortOrder,
} from "./job-postings.constants";
import {
  deleteJobPosting,
  jobPostingKeys,
  useJobPostingList,
  type JobPostingListParams,
} from "./job-postings.queries";

type Actor = "admin" | "recruiter";
const SORT_FIELDS: readonly JobSortBy[] = ["created_at", "title", "expires_at"];

export function JobPostingListPage({ actor }: { actor: Actor }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const { page, limit, search, debouncedSearch, set, setMany } = useListParams({
    defaultLimit: JOB_LIST_DEFAULT_LIMIT,
  });
  const [pendingDelete, setPendingDelete] = useState<JobPosting | null>(null);

  const type = searchParams.get(LIST_PARAMS.type) ?? ALL_OPTION;
  const level = searchParams.get(LIST_PARAMS.level) ?? ALL_OPTION;
  const requestedSort = searchParams.get(
    LIST_PARAMS.sortBy,
  ) as JobSortBy | null;
  const sortBy =
    requestedSort && SORT_FIELDS.includes(requestedSort)
      ? requestedSort
      : DEFAULT_SORT.by;
  const sortOrder: JobSortOrder =
    searchParams.get(LIST_PARAMS.sortOrder) === "asc"
      ? "asc"
      : searchParams.get(LIST_PARAMS.sortOrder) === "desc"
        ? "desc"
        : DEFAULT_SORT.order;

  const basePath = `/${actor}/job-postings`;
  const hasFilters =
    search !== "" || type !== ALL_OPTION || level !== ALL_OPTION;
  const params: JobPostingListParams = {
    page,
    limit,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(type !== ALL_OPTION ? { employment_type: type } : {}),
    ...(level !== ALL_OPTION ? { level } : {}),
  };
  const query = useJobPostingList(actor, params);
  const total = query.data?.total ?? 0;

  const deletion = useMutation({
    mutationFn: deleteJobPosting,
    onError: (error) =>
      showToast({
        title: t("jobPostings.delete.failedTitle"),
        message: jobPostingErrorMessage(error, t),
        tone: "error",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: jobPostingKeys.root(actor),
      });
      showToast({
        title: t("jobPostings.delete.doneTitle"),
        message: t("jobPostings.delete.doneMessage", {
          title: pendingDelete?.title,
        }),
        tone: "success",
      });
      setPendingDelete(null);
    },
  });

  function handleSort(field: JobSortBy) {
    const nextOrder: JobSortOrder =
      sortBy === field
        ? sortOrder === "asc"
          ? "desc"
          : "asc"
        : field === "title"
          ? "asc"
          : "desc";
    setMany({
      [LIST_PARAMS.sortBy]: field,
      [LIST_PARAMS.sortOrder]: nextOrder,
    });
  }

  const clearFilters = () =>
    setMany({
      search: null,
      [LIST_PARAMS.type]: null,
      [LIST_PARAMS.level]: null,
    });
  const filterLabel = (label: string) =>
    `${label}: ${t("jobPostings.toolbar.all")}`;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        actions={
          actor === "recruiter" ? (
            <Button
              asChild
              className="h-11 px-5 text-sm font-semibold"
              shape="pill"
            >
              <Link to={`${basePath}/create`}>
                <Plus className="size-4" />
                {t("jobPostings.create")}
              </Link>
            </Button>
          ) : undefined
        }
        description={t(
          actor === "admin"
            ? "jobPostings.subtitleAdmin"
            : "jobPostings.subtitleCount",
          { count: total },
        )}
        title={t("jobPostings.title")}
      />

      <ListToolbar
        onSearchChange={(value) => set("search", value)}
        search={search}
        searchPlaceholder={t("jobPostings.searchPlaceholder")}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <FilterSelect
            onChange={(value) =>
              set(LIST_PARAMS.type, value === ALL_OPTION ? null : value)
            }
            options={[
              {
                label: filterLabel(t("jobPostings.toolbar.type")),
                value: ALL_OPTION,
              },
              ...JOB_EMPLOYMENT_TYPES.map((value) => ({
                label: t(`jobPostings.employmentTypes.${value}`),
                value,
              })),
            ]}
            placeholder={filterLabel(t("jobPostings.toolbar.type"))}
            value={type}
          />
          <FilterSelect
            onChange={(value) =>
              set(LIST_PARAMS.level, value === ALL_OPTION ? null : value)
            }
            options={[
              {
                label: filterLabel(t("jobPostings.toolbar.level")),
                value: ALL_OPTION,
              },
              ...JOB_LEVELS.map((value) => ({ label: value, value })),
            ]}
            placeholder={filterLabel(t("jobPostings.toolbar.level"))}
            value={level}
          />
          {hasFilters ? (
            <Button
              className="h-10 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
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
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
          <JobPostingTable
            basePath={basePath}
            canManage={actor === "recruiter"}
            hasFilters={hasFilters}
            isLoading={query.isPending}
            items={query.data?.items ?? []}
            onClearFilters={clearFilters}
            onDelete={setPendingDelete}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </div>
      )}

      {total > 0 ? (
        <Pagination
          limit={limit}
          onLimitChange={(value) =>
            setMany({ limit: String(value), page: "1" })
          }
          onPageChange={(value) => set("page", String(value))}
          page={page}
          total={total}
          totalPages={query.data?.totalPages ?? 1}
        />
      ) : null}

      {actor === "recruiter" && pendingDelete ? (
        <ActionConfirmDialog
          action={
            deletion.isPending
              ? t("jobPostings.delete.deleting")
              : t("jobPostings.delete.confirm")
          }
          description={t("jobPostings.delete.description")}
          disabled={deletion.isPending}
          icon={Trash2}
          onConfirm={() => deletion.mutate(pendingDelete.id)}
          onOpenChange={(open) => !open && setPendingDelete(null)}
          open
          title={t("jobPostings.delete.title", { title: pendingDelete.title })}
          variant="destructive-solid"
        />
      ) : null}
    </div>
  );
}
