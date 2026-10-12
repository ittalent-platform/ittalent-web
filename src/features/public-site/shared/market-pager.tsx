import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const ROUND = "flex size-9 items-center justify-center rounded-full";
const ARROW = (disabled: boolean) =>
  cn(
    ROUND,
    "border border-mkt-line-strong bg-white",
    disabled
      ? "cursor-default text-mkt-check"
      : "text-mkt-ink hover:bg-mkt-chip",
  );

/** 1 2 3 … last, plus the current page; every page when there are six or fewer. */
function pageNumbers(
  page: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 6)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, 3, totalPages]);
  if (page > 1 && page < totalPages) pages.add(page);
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  sorted.forEach((p, idx) => {
    if (idx > 0 && p - sorted[idx - 1] > 1) out.push("ellipsis");
    out.push(p);
  });
  return out;
}

/** Round marketplace pager (Jobs / Companies). */
export function MarketPager({
  className,
  onPageChange,
  page,
  totalPages,
}: {
  className?: string;
  onPageChange: (page: number) => void;
  page: number;
  totalPages: number;
}) {
  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-center gap-1.5",
        className,
      )}
    >
      <button
        aria-label="Previous page"
        className={ARROW(page === 1)}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </button>
      {pageNumbers(page, totalPages).map((p, idx) =>
        p === "ellipsis" ? (
          <span className="w-6 text-center text-mkt-subtle" key={`e-${idx}`}>
            …
          </span>
        ) : (
          <button
            aria-current={p === page ? "page" : undefined}
            className={cn(
              ROUND,
              "text-[13px] font-semibold",
              p === page
                ? "bg-mkt-accent text-white"
                : "border border-mkt-line-strong bg-white text-mkt-ink hover:bg-mkt-chip",
            )}
            key={p}
            onClick={() => onPageChange(p)}
            type="button"
          >
            {p}
          </button>
        ),
      )}
      <button
        aria-label="Next page"
        className={ARROW(page === totalPages)}
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </nav>
  );
}
