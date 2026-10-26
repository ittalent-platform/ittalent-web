import { Bookmark, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";

export type SavedJobsEmptyStateProps = {
  type: "empty" | "search";
  searchQuery?: string;
  onClearSearch?: () => void;
};

export function SavedJobsEmptyState({
  type,
  searchQuery,
  onClearSearch,
}: SavedJobsEmptyStateProps) {
  const { t } = useTranslation();

  if (type === "search") {
    return (
      <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-mkt-line bg-white p-10 text-center shadow-xs sm:p-14">
        <div className="grid size-12 place-items-center rounded-full bg-mkt-chip text-mkt-muted">
          <Search aria-hidden="true" className="size-5" />
        </div>

        <div className="flex max-w-sm flex-col gap-1.5">
          <h2 className="itt-display text-lg font-semibold text-mkt-ink">
            {t("savedJobs.empty.searchNoMatchTitle", "No saved jobs match “{{query}}”", {
              query: searchQuery || "",
            })}
          </h2>
          <p className="text-[13.5px] text-mkt-ink-2">
            {t(
              "savedJobs.empty.searchNoMatchDescription",
              "Try another word or clear the search.",
            )}
          </p>
        </div>

        {onClearSearch ? (
          <Button
            className="mt-2 h-10 px-5 text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip shadow-xs"
            onClick={onClearSearch}
            shape="pill"
            variant="outline"
          >
            {t("savedJobs.toolbar.clearSearch", "Clear search")}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-mkt-line bg-white p-10 text-center shadow-xs sm:p-14">
      <div className="grid size-12 place-items-center rounded-full bg-mkt-accent-soft text-mkt-brand">
        <Bookmark aria-hidden="true" className="size-5" />
      </div>

      <div className="flex max-w-sm flex-col gap-1.5">
        <h2 className="itt-display text-lg font-semibold text-mkt-ink">
          {t("savedJobs.empty.title", "No saved jobs yet")}
        </h2>
        <p className="text-[13.5px] leading-relaxed text-mkt-ink-2">
          {t(
            "savedJobs.empty.description",
            "Tap the heart on any job to keep it here. Only you can see them.",
          )}
        </p>
      </div>

      <Button
        asChild
        className="mt-2 h-10 px-6 text-[13.5px] font-semibold bg-mkt-accent text-white hover:bg-mkt-accent-hover shadow-xs"
        shape="pill"
      >
        <Link to="/career">
          {t("savedJobs.empty.browseJobs", "Browse jobs")}
        </Link>
      </Button>
    </div>
  );
}
