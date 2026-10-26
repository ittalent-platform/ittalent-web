import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { AllAvailableBanner } from "./components/all-available-banner";
import { RemoveUnavailableDialog } from "./components/remove-unavailable-dialog";
import { SavedJobCard } from "./components/saved-job-card";
import { SavedJobsEmptyState } from "./components/saved-jobs-empty-state";
import {
  MAX_SEARCH_LENGTH,
  type SavedJobsFilterTab,
  SavedJobsToolbar,
} from "./components/saved-jobs-toolbar";
import { UnavailableJobCard } from "./components/unavailable-job-card";
import {
  useRemoveSavedJobByIdMutation,
  useSavedJobsQuery,
  useSaveJobMutation,
} from "./saved-jobs.queries";
import type { SavedJobItem } from "./saved-jobs.types";

const PAGE_SIZE = 20;

export function SavedJobsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<SavedJobsFilterTab>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [targetUnavailableJob, setTargetUnavailableJob] =
    React.useState<SavedJobItem | null>(null);
  const [removingIds, setRemovingIds] = React.useState<Set<string>>(new Set());

  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const normalizedQuery =
    debouncedSearch.length <= MAX_SEARCH_LENGTH
      ? debouncedSearch.trim()
      : debouncedSearch.slice(0, MAX_SEARCH_LENGTH).trim();

  // Reset page whenever search or filter tab changes
  React.useEffect(() => {
    setPage(1);
  }, [activeTab, normalizedQuery]);

  // Tab counts
  const allCountQuery = useSavedJobsQuery({ status: "all", limit: 1 });
  const availableCountQuery = useSavedJobsQuery({ status: "available", limit: 1 });
  const unavailableCountQuery = useSavedJobsQuery({
    status: "unavailable",
    limit: 1,
  });

  const counts = {
    all: allCountQuery.data?.total ?? 0,
    available: availableCountQuery.data?.total ?? 0,
    unavailable: unavailableCountQuery.data?.total ?? 0,
  };

  // Main items query
  const mainQuery = useSavedJobsQuery({
    status: activeTab,
    q: normalizedQuery || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const removeMutation = useRemoveSavedJobByIdMutation();
  const saveMutation = useSaveJobMutation();

  const items = mainQuery.data?.items ?? [];
  const total = mainQuery.data?.total ?? 0;
  const totalPages = mainQuery.data?.totalPages ?? 1;

  // Handle Remove Available Job (instant deletion with Undo toast)
  const handleRemoveAvailable = (item: SavedJobItem) => {
    setRemovingIds((prev) => new Set(prev).add(item.id));

    removeMutation.mutate(
      { id: item.id, jobId: item.jobId },
      {
        onSuccess: () => {
          setRemovingIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });

          showToast({
            tone: "success",
            title: t("savedJobs.toast.removedTitle", "Removed from saved jobs."),
            message: "",
            action: {
              label: t("savedJobs.toast.undo", "Undo"),
              onClick: () => {
                saveMutation.mutate(item.jobId, {
                  onSuccess: () => {
                    showToast({
                      tone: "success",
                      title: t("savedJobs.toast.savedTitle", "Job saved"),
                      message: t(
                        "savedJobs.toast.savedMessage",
                        "Job saved to your bookmarks.",
                      ),
                    });
                  },
                });
              },
            },
          });
        },
        onError: () => {
          setRemovingIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          showToast({
            tone: "error",
            title: t("savedJobs.toast.errorRemoveTitle", "Couldn't remove job"),
            message: t(
              "savedJobs.toast.errorRemoveFallback",
              "Couldn't remove. Try again",
            ),
          });
        },
      },
    );
  };

  // Handle Remove Unavailable Job (confirmed via modal)
  const handleConfirmRemoveUnavailable = () => {
    if (!targetUnavailableJob) return;
    const item = targetUnavailableJob;
    setRemovingIds((prev) => new Set(prev).add(item.id));

    removeMutation.mutate(
      { id: item.id, jobId: item.jobId },
      {
        onSuccess: () => {
          setRemovingIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          setTargetUnavailableJob(null);
          showToast({
            tone: "success",
            title: t("savedJobs.toast.removedTitle", "Removed from saved jobs."),
            message: "",
          });
        },
        onError: () => {
          setRemovingIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          setTargetUnavailableJob(null);
          showToast({
            tone: "error",
            title: t("savedJobs.toast.errorRemoveTitle", "Couldn't remove job"),
            message: t(
              "savedJobs.toast.errorRemoveFallback",
              "Couldn't remove. Try again",
            ),
          });
        },
      },
    );
  };

  // Subtitle wording based on active filter state
  const subtitleText = React.useMemo(() => {
    if (activeTab === "unavailable") {
      return t(
        "savedJobs.subtitleUnavailable",
        "{{count}} saved jobs are no longer available · you can only remove them",
        { count: total },
      );
    }
    if (normalizedQuery) {
      return t(
        "savedJobs.subtitleSearch",
        "{{count}} saved jobs match “{{query}}”",
        { count: total, query: normalizedQuery },
      );
    }
    return t(
      "savedJobs.subtitleAll",
      "{{count}} saved jobs · newest saved first",
      { count: total },
    );
  }, [activeTab, normalizedQuery, total, t]);

  const startItem = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="itt-display text-2xl font-bold tracking-tight text-mkt-ink md:text-3xl">
          {t("savedJobs.title", "Saved jobs")}
        </h1>
      </div>

      {/* Toolbar: Search & Segmented Filter Tabs */}
      <SavedJobsToolbar
        activeTab={activeTab}
        counts={counts}
        onSearchChange={setSearchQuery}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
      />

      {/* Subtitle counter / sorting note */}
      {!mainQuery.isError && (
        <p className="text-[13px] text-mkt-ink-2 font-medium">
          {subtitleText}
        </p>
      )}

      {/* Content Area */}
      {mainQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              className="h-28 rounded-2xl border border-mkt-line bg-white/60 animate-pulse"
              key={i}
            />
          ))}
        </div>
      ) : mainQuery.isError ? (
        <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-danger/20 bg-danger/5 p-10 text-center sm:p-14">
          <div className="grid size-12 place-items-center rounded-full bg-danger/10 text-danger">
            <AlertCircle aria-hidden="true" className="size-6" />
          </div>
          <div className="flex max-w-sm flex-col gap-1.5">
            <h2 className="itt-display text-lg font-semibold text-mkt-ink">
              {t("savedJobs.error.title", "Your saved jobs didn’t load")}
            </h2>
            <p className="text-[13.5px] text-mkt-ink-2">
              {t(
                "savedJobs.error.description",
                "Check your connection and try again.",
              )}
            </p>
          </div>
          <Button
            className="mt-2 h-10 px-5 text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip shadow-xs"
            onClick={() => mainQuery.refetch()}
            shape="pill"
            variant="outline"
          >
            {t("savedJobs.error.retry", "Try again")}
          </Button>
        </div>
      ) : items.length === 0 ? (
        normalizedQuery ? (
          <SavedJobsEmptyState
            onClearSearch={() => setSearchQuery("")}
            searchQuery={normalizedQuery}
            type="search"
          />
        ) : activeTab === "unavailable" && counts.unavailable === 0 ? (
          <AllAvailableBanner onShowAll={() => setActiveTab("all")} />
        ) : counts.all === 0 ? (
          <SavedJobsEmptyState type="empty" />
        ) : (
          <SavedJobsEmptyState
            onClearSearch={() => setActiveTab("all")}
            type="search"
          />
        )
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) =>
            item.availability === "available" ? (
              <SavedJobCard
                isRemoving={removingIds.has(item.id)}
                item={item}
                key={item.id}
                onRemove={handleRemoveAvailable}
              />
            ) : (
              <UnavailableJobCard
                isRemoving={removingIds.has(item.id)}
                item={item}
                key={item.id}
                onRequestRemove={(job) => setTargetUnavailableJob(job)}
              />
            ),
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {!mainQuery.isLoading && !mainQuery.isError && total > 0 ? (
        <div className="mt-2 flex flex-col items-center justify-between gap-4 border-t border-mkt-line pt-4 sm:flex-row">
          <span className="text-[13px] text-mkt-ink-2 tabular-nums">
            {t("savedJobs.pagination.showing", "Showing {{start}}–{{end}} of {{total}}", {
              start: startItem,
              end: endItem,
              total,
            })}
          </span>

          <div className="flex items-center gap-2">
            <button
              aria-label={t("common.previousPage", "Previous page")}
              className="grid size-8 place-items-center rounded-lg border border-mkt-line bg-white text-mkt-ink transition-colors hover:bg-mkt-chip disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>

            <span className="px-2 text-xs font-semibold tabular-nums text-mkt-ink">
              {page} / {totalPages || 1}
            </span>

            <button
              aria-label={t("common.nextPage", "Next page")}
              className="grid size-8 place-items-center rounded-lg border border-mkt-line bg-white text-mkt-ink transition-colors hover:bg-mkt-chip disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Modal Dialog for Unavailable Job Removal */}
      <RemoveUnavailableDialog
        isPending={
          targetUnavailableJob
            ? removingIds.has(targetUnavailableJob.id)
            : false
        }
        onConfirm={handleConfirmRemoveUnavailable}
        onOpenChange={(open) => {
          if (!open) setTargetUnavailableJob(null);
        }}
        open={Boolean(targetUnavailableJob)}
      />
    </div>
  );
}
