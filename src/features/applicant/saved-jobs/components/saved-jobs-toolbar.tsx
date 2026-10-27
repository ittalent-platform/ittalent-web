import { AlertTriangle, Search, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type SavedJobsFilterTab = "all" | "available" | "unavailable";

export type SavedJobsToolbarProps = {
  activeTab: SavedJobsFilterTab;
  onTabChange: (tab: SavedJobsFilterTab) => void;
  counts: {
    all: number;
    available: number;
    unavailable: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  disabled?: boolean;
};

export const MAX_SEARCH_LENGTH = 100;

export function SavedJobsToolbar({
  activeTab,
  onTabChange,
  counts,
  searchQuery,
  onSearchChange,
  disabled = false,
}: SavedJobsToolbarProps) {
  const { t } = useTranslation();
  const isOverLimit = searchQuery.length > MAX_SEARCH_LENGTH;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleClear = () => {
    onSearchChange("");
  };

  const tabs: Array<{
    id: SavedJobsFilterTab;
    label: string;
    count: number;
  }> = [
    {
      id: "all",
      label: t("savedJobs.tabs.all", "All"),
      count: counts.all,
    },
    {
      id: "available",
      label: t("savedJobs.tabs.available", "Available"),
      count: counts.available,
    },
    {
      id: "unavailable",
      label: t("savedJobs.tabs.unavailable", "No longer available"),
      count: counts.unavailable,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-md">
          <div
            className={cn(
              "flex h-11 w-full items-center gap-2.5 rounded-full border bg-white px-3.5 transition-colors shadow-xs",
              isOverLimit
                ? "border-danger focus-within:border-danger focus-within:ring-1 focus-within:ring-danger"
                : "border-mkt-line-strong focus-within:border-mkt-brand focus-within:ring-1 focus-within:ring-mkt-brand",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          >
            <Search aria-hidden="true" className="size-4 shrink-0 text-mkt-muted" />
            <input
              aria-invalid={isOverLimit}
              aria-label={t("savedJobs.toolbar.searchLabel", "Search saved jobs")}
              className="h-full flex-1 bg-transparent text-[13.5px] text-mkt-ink placeholder:text-mkt-muted focus:outline-none disabled:cursor-not-allowed"
              disabled={disabled}
              onChange={handleInputChange}
              placeholder={t(
                "savedJobs.toolbar.searchPlaceholder",
                "Search title, company, city or skill",
              )}
              type="text"
              value={searchQuery}
            />
            {searchQuery.length > 0 ? (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-mono",
                    isOverLimit ? "font-semibold text-danger" : "text-mkt-muted",
                  )}
                >
                  {searchQuery.length} / {MAX_SEARCH_LENGTH}
                </span>
                <button
                  aria-label={t("savedJobs.toolbar.clearSearch", "Clear search")}
                  className="grid size-5 place-items-center rounded-full text-mkt-muted hover:bg-mkt-chip hover:text-mkt-ink"
                  onClick={handleClear}
                  type="button"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Segmented Filter Tabs */}
        <div
          aria-label={t("savedJobs.tabs.label", "Filter saved jobs")}
          className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-mkt-line bg-mkt-chip/60 p-1 shadow-xs no-scrollbar"
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                aria-selected={isActive}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center justify-center rounded-full px-3.5 text-[13px] font-semibold transition-all",
                  isActive
                    ? "border border-mkt-line-strong bg-white text-mkt-ink shadow-xs"
                    : "border border-transparent text-mkt-ink-2 hover:bg-white/50 hover:text-mkt-ink",
                  disabled && "pointer-events-none opacity-50",
                )}
                disabled={disabled}
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                role="tab"
                type="button"
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "ml-2 inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                    isActive
                      ? "bg-mkt-chip text-mkt-ink"
                      : "bg-mkt-line-soft text-mkt-muted",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Over-Limit Validation Error (Board 12) */}
      {isOverLimit ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2 text-xs font-medium text-danger animate-in fade-in"
          role="alert"
        >
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          <span>
            {t("savedJobs.toolbar.keywordTooLong", "Use up to 100 characters.")}
          </span>
        </div>
      ) : null}
    </div>
  );
}
