import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FilterSelect } from "./filter-select";

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;

export function PaginationControls({
  onPageChange,
  page,
  totalPages,
}: {
  onPageChange: (page: number) => void;
  page: number;
  totalPages: number;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  function submitPage(value = draft) {
    const nextPage = Number(value);

    if (Number.isInteger(nextPage) && nextPage >= 1 && nextPage <= totalPages) {
      onPageChange(nextPage);
    } else {
      setDraft(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-(--border-strong) bg-card text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground/60"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <input
          aria-label="Page number"
          className="h-9 w-12 rounded-md border border-(--border-strong) bg-card px-2 text-center font-semibold text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          inputMode="numeric"
          max={totalPages}
          min={1}
          onBlur={(event) => submitPage(event.currentTarget.value)}
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submitPage(event.currentTarget.value);
              event.currentTarget.blur();
            }
          }}
          type="text"
          value={draft ?? String(page)}
        />
        <span aria-label={`${totalPages} total pages`}>/ {totalPages}</span>
      </div>

      <button
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-(--border-strong) bg-card text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground/60"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

export type PaginationProps = {
  limit: number;
  onLimitChange: (limit: number) => void;
  onPageChange: (page: number) => void;
  page: number;
  pageSizeOptions?: readonly number[];
  total: number;
  totalPages: number;
};

export function Pagination({
  limit,
  onLimitChange,
  onPageChange,
  page,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  total,
  totalPages,
}: PaginationProps) {
  const { t } = useTranslation();

  if (total === 0) {
    return null;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-[13px] font-normal leading-normal text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>{t("pagination.showing", { end, start, total })}</span>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("pagination.rows")}</span>
          <FilterSelect
            onChange={(value) => onLimitChange(Number(value))}
            options={pageSizeOptions.map((size) => ({ label: String(size), value: String(size) }))}
            size="sm"
            value={String(limit)}
          />
        </div>
      </div>

      <PaginationControls onPageChange={onPageChange} page={page} totalPages={totalPages} />
    </div>
  );
}
