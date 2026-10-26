import { Ban, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatDateDMY, postedAgo } from "@/features/public-site/career/career-format";
import { cn } from "@/lib/utils";
import type { SavedJobItem } from "@/features/applicant/saved-jobs/saved-jobs.types";

export type UnavailableJobCardProps = {
  item: SavedJobItem;
  onRequestRemove: (item: SavedJobItem) => void;
  isRemoving?: boolean;
};

export function UnavailableJobCard({
  item,
  onRequestRemove,
  isRemoving = false,
}: UnavailableJobCardProps) {
  const { t } = useTranslation();

  const savedDate = formatDateDMY(item.savedAt) || postedAgo(item.savedAt);

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border border-dashed border-mkt-line-strong bg-white/70 p-5 transition-all shadow-2xs hover:bg-white sm:flex-row sm:items-center sm:justify-between sm:p-6",
        isRemoving && "opacity-50 pointer-events-none",
      )}
    >
      {/* Left: Obfuscated Icon and Warning */}
      <div className="flex flex-1 min-w-0 items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-mkt-chip text-mkt-muted">
          <Ban aria-hidden="true" className="size-5 text-mkt-muted" />
        </div>

        <div className="flex flex-1 min-w-0 flex-col gap-1">
          <h2 className="itt-display text-base font-semibold text-mkt-ink sm:text-[17px]">
            {t(
              "savedJobs.unavailable.title",
              "This job is no longer available",
            )}
          </h2>

          <p className="text-[13px] leading-relaxed text-mkt-ink-2">
            {t(
              "savedJobs.unavailable.description",
              "It may have closed, passed its deadline or been taken down. Its details are hidden.",
            )}
          </p>
        </div>
      </div>

      {/* Right: Tag, Saved Date & Remove Button */}
      <div className="flex flex-col items-start gap-3 border-t border-mkt-line pt-3 sm:flex-row sm:items-center sm:gap-6 sm:border-t-0 sm:pt-0 sm:text-right">
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="inline-flex items-center rounded-full bg-mkt-chip px-2.5 py-0.5 text-xs font-medium text-mkt-ink-2">
            {t("savedJobs.unavailable.tag", "No longer available")}
          </span>
          {savedDate ? (
            <span className="text-xs text-mkt-subtle">
              {t("savedJobs.card.savedTime", "Saved {{time}}", { time: savedDate })}
            </span>
          ) : null}
        </div>

        <div className="flex w-full items-center justify-end sm:w-auto">
          <button
            aria-label={t(
              "savedJobs.card.removeAriaLabel",
              "Saved. Remove from saved jobs",
            )}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-mkt-accent-border bg-mkt-accent-soft text-mkt-brand transition-colors hover:bg-mkt-accent-soft/80"
            onClick={() => onRequestRemove(item)}
            title={t("savedJobs.card.removeTitle", "Remove from saved jobs")}
            type="button"
          >
            <Heart aria-hidden="true" className="size-[18px] fill-mkt-brand stroke-mkt-brand" />
          </button>
        </div>
      </div>
    </article>
  );
}
