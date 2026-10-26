import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { LogoTile } from "@/components/common/logo-tile";
import { Button } from "@/components/ui/button";
import {
  EMPLOYMENT_LABELS,
  formatDeadline,
  formatSalaryCard,
  LEVEL_LABELS,
  postedAgo,
} from "@/features/public-site/career/career-format";
import { cn } from "@/lib/utils";
import type { SavedJobItem } from "@/features/applicant/saved-jobs/saved-jobs.types";

export type SavedJobCardProps = {
  item: SavedJobItem;
  onRemove: (item: SavedJobItem) => void;
  isRemoving?: boolean;
};

export function SavedJobCard({ item, onRemove, isRemoving = false }: SavedJobCardProps) {
  const { t } = useTranslation();

  const companyName = item.enterprise?.name || t("savedJobs.card.companyFallback", "Company");
  const jobLink = item.slug ? `/career/${item.slug}` : `/career/${item.jobId}`;
  const empLabel = item.employmentType
    ? EMPLOYMENT_LABELS[item.employmentType] || item.employmentType
    : null;
  const levelLabel = item.level ? LEVEL_LABELS[item.level] || item.level : null;
  const deadline = formatDeadline(item.expiresAt || undefined);
  const savedRelative = postedAgo(item.savedAt);
  const salaryText = formatSalaryCard(
    item.salaryMin || undefined,
    item.salaryMax || undefined,
    item.currency,
  );

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border border-mkt-line bg-white p-5 transition-all shadow-xs hover:border-mkt-line-strong hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-6",
        isRemoving && "opacity-50 pointer-events-none",
      )}
    >
      {/* Left: Monogram and Details */}
      <div className="flex flex-1 min-w-0 items-start gap-4">
        <LogoTile
          className="size-12 shrink-0 rounded-xl"
          logoUrl={item.enterprise?.logoUrl || undefined}
          name={companyName}
          size="lg"
          tone="tint"
        />

        <div className="flex flex-1 min-w-0 flex-col gap-1.5">
          <Link
            className="itt-display text-base font-semibold text-mkt-ink transition-colors hover:text-mkt-accent-hover sm:text-[17px] truncate"
            to={jobLink}
          >
            {item.title || t("savedJobs.card.jobTitleFallback", "Untitled Position")}
          </Link>

          <p className="text-[13px] text-mkt-ink-2 truncate">
            <span>{companyName}</span>
            {item.location ? <span> · {item.location}</span> : null}
            {empLabel ? <span> · {empLabel}</span> : null}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {empLabel ? (
              <span className="inline-flex items-center rounded-full bg-mkt-chip px-2.5 py-0.5 text-xs font-medium text-mkt-ink-2">
                {empLabel}
              </span>
            ) : null}
            {levelLabel ? (
              <span className="inline-flex items-center rounded-full bg-mkt-chip px-2.5 py-0.5 text-xs font-medium text-mkt-ink-2">
                {levelLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Middle & Right: Salary, Deadlines & Actions */}
      <div className="flex flex-col items-start gap-3 border-t border-mkt-line pt-3 sm:flex-row sm:items-center sm:gap-6 sm:border-t-0 sm:pt-0 sm:text-right">
        {/* Salary & Deadlines */}
        <div className="flex flex-col items-start gap-1 sm:items-end sm:min-w-[170px]">
          <span className="text-[15px] font-semibold text-mkt-ink">
            {salaryText}
          </span>

          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
            {item.isClosingSoon ? (
              <span className="inline-flex items-center rounded-full border border-mkt-amber-border bg-mkt-amber-bg px-2 py-0.5 text-[11px] font-semibold text-mkt-amber-fg">
                {t("savedJobs.card.closesIn2Days", "Closes in 2 days")}
              </span>
            ) : null}
            {deadline ? (
              <span className="text-xs text-mkt-ink-2">
                {t("savedJobs.card.applyBy", "Apply by")} <strong>{deadline}</strong>
              </span>
            ) : null}
          </div>

          {savedRelative ? (
            <span className="text-xs text-mkt-subtle">
              {t("savedJobs.card.savedTime", "Saved {{time}}", { time: savedRelative })}
            </span>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <button
            aria-label={t(
              "savedJobs.card.removeAriaLabel",
              "Saved. Remove from saved jobs",
            )}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-mkt-accent-border bg-mkt-accent-soft text-mkt-brand transition-colors hover:bg-mkt-accent-soft/80"
            onClick={() => onRemove(item)}
            title={t("savedJobs.card.removeTitle", "Remove from saved jobs")}
            type="button"
          >
            <Heart aria-hidden="true" className="size-[18px] fill-mkt-brand stroke-mkt-brand" />
          </button>

          <Button
            asChild
            className="h-10 px-6 text-[13.5px] font-semibold bg-mkt-accent text-white hover:bg-mkt-accent-hover shadow-xs"
            shape="pill"
          >
            <Link to={jobLink}>
              {t("savedJobs.card.apply", "Apply")}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
