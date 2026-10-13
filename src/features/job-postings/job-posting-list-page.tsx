import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

import type { JobPosting } from "@/api/generated/types.gen";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { ErrorState } from "@/components/common/error-state";
import { ListToolbar } from "@/components/common/list-toolbar";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Pagination } from "@/components/ui/pagination";
import { useListParams } from "@/hooks/use-list-params";

import {
  ArchiveJobDialog,
  CloseJobDialog,
  DeleteJobDialog,
  MoveToDraftDialog,
  PublishChecklistDialog,
  PublishJobDialog,
  ReopenJobDialog,
  UnarchiveJobDialog,
} from "./job-posting-dialogs";
import { jobPostingErrorMessage } from "./job-posting-errors";
import { JobPostingTable } from "./job-posting-table";
import {
  ALL_OPTION,
  DEFAULT_SORT,
  JOB_EMPLOYMENT_TYPES,
  JOB_LEVELS,
  JOB_LIST_DEFAULT_LIMIT,
  JOB_PUBLICATION_STATUSES,
  JOB_RECRUITMENT_STATUSES,
  LIST_PARAMS,
  type JobSortBy,
  type JobSortOrder,
} from "./job-postings.constants";
import {
  deleteJobPosting,
  jobPostingKeys,
  moveJobPostingToDraft,
  publishJobPosting,
  transitionJobPosting,
  useJobPostingList,
  type JobPostingListParams,
  type JobPostingTransition,
} from "./job-postings.queries";

type Actor = "admin" | "recruiter";
const SORT_FIELDS: readonly JobSortBy[] = ["created_at", "title", "expires_at"];
const SEARCH_REGEX = /^[a-zA-Z0-9\s.\-'\u00C0-\u024F\u1EA0-\u1EF9]*$/;

export function JobPostingListPage({ actor }: { actor: Actor }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const { page, limit, search, debouncedSearch, set, setMany } = useListParams({
    defaultLimit: JOB_LIST_DEFAULT_LIMIT,
  });

  const [pendingDelete, setPendingDelete] = useState<JobPosting | null>(null);
  const [pendingClose, setPendingClose] = useState<JobPosting | null>(null);
  const [pendingArchive, setPendingArchive] = useState<JobPosting | null>(null);
  const [pendingUnarchive, setPendingUnarchive] = useState<JobPosting | null>(
    null,
  );
  const [pendingReopen, setPendingReopen] = useState<JobPosting | null>(null);
  const [pendingPublish, setPendingPublish] = useState<JobPosting | null>(null);
  const [pendingPublishBlocked, setPendingPublishBlocked] =
    useState<JobPosting | null>(null);
  const [pendingUnpublish, setPendingUnpublish] = useState<JobPosting | null>(
    null,
  );

  const type = searchParams.get(LIST_PARAMS.type) ?? ALL_OPTION;
  const level = searchParams.get(LIST_PARAMS.level) ?? ALL_OPTION;
  const requestedPublicationStatus = searchParams.get(
    LIST_PARAMS.publicationStatus,
  );
  const publicationStatus = JOB_PUBLICATION_STATUSES.find(
    (status) => status === requestedPublicationStatus,
  );
  const requestedRecruitmentStatus = searchParams.get(
    LIST_PARAMS.recruitmentStatus,
  );
  const recruitmentStatus = JOB_RECRUITMENT_STATUSES.find(
    (status) => status === requestedRecruitmentStatus,
  );
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
    search !== "" ||
    type !== ALL_OPTION ||
    level !== ALL_OPTION ||
    Boolean(publicationStatus) ||
    Boolean(recruitmentStatus);

  const isSearchValid = SEARCH_REGEX.test(search);
  const searchError =
    !isSearchValid && search ? t("jobPostings.search.validation") : undefined;

  const params: JobPostingListParams = {
    page,
    limit,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(isSearchValid && debouncedSearch ? { search: debouncedSearch } : {}),
    ...(type !== ALL_OPTION ? { employment_type: type } : {}),
    ...(level !== ALL_OPTION ? { level } : {}),
    ...(publicationStatus ? { publication_status: publicationStatus } : {}),
    ...(recruitmentStatus ? { recruitment_status: recruitmentStatus } : {}),
  };
  const query = useJobPostingList(actor, params);
  const total = query.data?.total ?? 0;

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: jobPostingKeys.root(actor),
    });

  const deletion = useMutation({
    mutationFn: deleteJobPosting,
    onError: (error) =>
      showToast({
        title: t("jobPostings.delete.failedTitle"),
        message: jobPostingErrorMessage(error, t),
        tone: "error",
      }),
    onSuccess: async () => {
      await invalidate();
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

  const transition = useMutation({
    mutationFn: ({
      id,
      action: transAction,
    }: {
      action: JobPostingTransition;
      id: string;
    }) => transitionJobPosting(id, transAction),
    onError: (error) =>
      showToast({
        title: t("jobPostings.lifecycle.failedTitle"),
        message: jobPostingErrorMessage(error, t),
        tone: "error",
      }),
    onSuccess: async (_data, variables) => {
      await invalidate();
      const doneKey =
        variables.action === "close"
          ? "close"
          : variables.action === "reopen"
            ? "reopen"
            : variables.action === "archive"
              ? "archive"
              : "restore";
      showToast({
        title: t(`jobPostings.lifecycle.${doneKey}.doneTitle`),
        message: t(`jobPostings.lifecycle.${doneKey}.doneMessage`),
        tone: "success",
      });
      setPendingClose(null);
      setPendingArchive(null);
      setPendingUnarchive(null);
      setPendingReopen(null);
    },
  });

  const publishing = useMutation({
    mutationFn: publishJobPosting,
    onError: (error) =>
      showToast({
        title: t("jobPostings.lifecycle.failedTitle"),
        message: jobPostingErrorMessage(error, t),
        tone: "error",
      }),
    onSuccess: async () => {
      await invalidate();
      showToast({
        title: t("jobPostings.lifecycle.publish.doneTitle"),
        message: t("jobPostings.lifecycle.publish.doneMessage"),
        tone: "success",
      });
      setPendingPublish(null);
    },
  });

  const unpublishing = useMutation({
    mutationFn: moveJobPostingToDraft,
    onError: (error) =>
      showToast({
        title: t("jobPostings.lifecycle.failedTitle"),
        message: jobPostingErrorMessage(error, t),
        tone: "error",
      }),
    onSuccess: async () => {
      await invalidate();
      showToast({
        title: t("jobPostings.lifecycle.draft.doneTitle"),
        message: t("jobPostings.lifecycle.draft.doneMessage"),
        tone: "success",
      });
      setPendingUnpublish(null);
    },
  });

  function handlePublishAttempt(posting: JobPosting) {
    const isReady = Boolean(
      posting.title &&
      posting.employmentType &&
      posting.location &&
      posting.description &&
      posting.description.trim().length >= 20 &&
      posting.requirements &&
      posting.requirements.trim().length > 0 &&
      posting.benefits &&
      posting.benefits.trim().length > 0 &&
      posting.expiresAt &&
      new Date(posting.expiresAt).getTime() >= Date.now(),
    );
    if (!isReady) {
      setPendingPublishBlocked(posting);
    } else {
      setPendingPublish(posting);
    }
  }

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
      [LIST_PARAMS.publicationStatus]: null,
      [LIST_PARAMS.recruitmentStatus]: null,
    });

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
        searchError={searchError}
        searchPlaceholder={t("jobPostings.searchPlaceholder")}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <FilterSelect
            onChange={(value) =>
              set(
                LIST_PARAMS.publicationStatus,
                value === ALL_OPTION ? null : value,
              )
            }
            options={[
              {
                label: t("jobPostings.toolbar.all"),
                value: ALL_OPTION,
              },
              ...JOB_PUBLICATION_STATUSES.map((val) => ({
                label: t(`jobPostings.publicationStatus.${val}`),
                value: val,
              })),
            ]}
            placeholder={t("jobPostings.toolbar.all")}
            renderTrigger={(selectedLabel) => (
              <span>
                {t("jobPostings.toolbar.publicationStatus")}:{" "}
                <span className="font-semibold text-foreground">
                  {selectedLabel}
                </span>
              </span>
            )}
            value={publicationStatus ?? ALL_OPTION}
          />

          <FilterSelect
            onChange={(value) =>
              set(LIST_PARAMS.type, value === ALL_OPTION ? null : value)
            }
            options={[
              {
                label: t("jobPostings.toolbar.all"),
                value: ALL_OPTION,
              },
              ...JOB_EMPLOYMENT_TYPES.map((val) => ({
                label: t(`jobPostings.employmentTypes.${val}`),
                value: val,
              })),
            ]}
            placeholder={t("jobPostings.toolbar.all")}
            renderTrigger={(selectedLabel) => (
              <span>
                {t("jobPostings.toolbar.type")}:{" "}
                <span className="font-semibold text-foreground">
                  {selectedLabel}
                </span>
              </span>
            )}
            value={type}
          />

          <FilterSelect
            onChange={(value) =>
              set(LIST_PARAMS.level, value === ALL_OPTION ? null : value)
            }
            options={[
              {
                label: t("jobPostings.toolbar.all"),
                value: ALL_OPTION,
              },
              ...JOB_LEVELS.map((val) => ({ label: val, value: val })),
            ]}
            placeholder={t("jobPostings.toolbar.all")}
            renderTrigger={(selectedLabel) => (
              <span>
                {t("jobPostings.toolbar.level")}:{" "}
                <span className="font-semibold text-foreground">
                  {selectedLabel}
                </span>
              </span>
            )}
            value={level}
          />

          <FilterSelect
            onChange={(value) =>
              set(
                LIST_PARAMS.recruitmentStatus,
                value === ALL_OPTION ? null : value,
              )
            }
            options={[
              {
                label: t("jobPostings.toolbar.all"),
                value: ALL_OPTION,
              },
              ...JOB_RECRUITMENT_STATUSES.map((val) => ({
                label: t(`jobPostings.recruitmentStatus.${val}`),
                value: val,
              })),
            ]}
            placeholder={t("jobPostings.toolbar.all")}
            renderTrigger={(selectedLabel) => (
              <span>
                {t("jobPostings.toolbar.recruitmentStatus")}:{" "}
                <span className="font-semibold text-foreground">
                  {selectedLabel}
                </span>
              </span>
            )}
            value={recruitmentStatus ?? ALL_OPTION}
          />

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
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <JobPostingTable
            basePath={basePath}
            canManage={actor === "recruiter"}
            hasFilters={hasFilters}
            isLoading={query.isPending}
            items={query.data?.items ?? []}
            onArchive={(p) => setPendingArchive(p)}
            onClearFilters={clearFilters}
            onClose={(p) => setPendingClose(p)}
            onDelete={(p) => setPendingDelete(p)}
            onPublish={handlePublishAttempt}
            onReopen={(p) => setPendingReopen(p)}
            onSort={handleSort}
            onUnarchive={(p) => setPendingUnarchive(p)}
            onUnpublish={(p) => setPendingUnpublish(p)}
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

      {/* Confirmation & Checklist Dialogs */}
      {actor === "recruiter" && pendingDelete ? (
        <DeleteJobDialog
          disabled={deletion.isPending}
          onConfirm={() => deletion.mutate(pendingDelete.id)}
          onOpenChange={(open) => !open && setPendingDelete(null)}
          open
          posting={pendingDelete}
        />
      ) : null}

      {actor === "recruiter" && pendingClose ? (
        <CloseJobDialog
          disabled={transition.isPending}
          onConfirm={() =>
            transition.mutate({ action: "close", id: pendingClose.id })
          }
          onOpenChange={(open) => !open && setPendingClose(null)}
          open
          posting={pendingClose}
        />
      ) : null}

      {actor === "recruiter" && pendingArchive ? (
        <ArchiveJobDialog
          disabled={transition.isPending}
          onConfirm={() =>
            transition.mutate({ action: "archive", id: pendingArchive.id })
          }
          onOpenChange={(open) => !open && setPendingArchive(null)}
          open
          posting={pendingArchive}
        />
      ) : null}

      {actor === "recruiter" && pendingUnarchive ? (
        <UnarchiveJobDialog
          disabled={transition.isPending}
          onConfirm={() =>
            transition.mutate({ action: "restore", id: pendingUnarchive.id })
          }
          onOpenChange={(open) => !open && setPendingUnarchive(null)}
          open
          posting={pendingUnarchive}
        />
      ) : null}

      {actor === "recruiter" && pendingReopen ? (
        <ReopenJobDialog
          disabled={transition.isPending}
          onConfirm={() =>
            transition.mutate({ action: "reopen", id: pendingReopen.id })
          }
          onOpenChange={(open) => !open && setPendingReopen(null)}
          open
          posting={pendingReopen}
        />
      ) : null}

      {actor === "recruiter" && pendingPublish ? (
        <PublishJobDialog
          disabled={publishing.isPending}
          onConfirm={() => publishing.mutate(pendingPublish.id)}
          onOpenChange={(open) => !open && setPendingPublish(null)}
          open
          posting={pendingPublish}
        />
      ) : null}

      {actor === "recruiter" && pendingPublishBlocked ? (
        <PublishChecklistDialog
          editPath={`${basePath}/${pendingPublishBlocked.id}/edit`}
          onOpenChange={(open) => !open && setPendingPublishBlocked(null)}
          open
          posting={pendingPublishBlocked}
        />
      ) : null}

      {actor === "recruiter" && pendingUnpublish ? (
        <MoveToDraftDialog
          disabled={unpublishing.isPending}
          onConfirm={() => unpublishing.mutate(pendingUnpublish.id)}
          onOpenChange={(open) => !open && setPendingUnpublish(null)}
          open
          posting={pendingUnpublish}
        />
      ) : null}
    </div>
  );
}
