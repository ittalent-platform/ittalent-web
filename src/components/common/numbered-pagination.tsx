import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, 4, 5];
  if (currentPage >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
}

export function NumberedPagination({
  ariaLabel = "Pagination",
  onPageChange,
  page,
  totalPages,
}: {
  ariaLabel?: string;
  onPageChange: (page: number) => void;
  page: number;
  totalPages: number;
}) {
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <nav aria-label={ariaLabel} className="flex items-center gap-2">
      <Button aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)} size="icon" variant="outline">
        <ChevronLeft className="size-[18px]" />
      </Button>
      {visiblePages.map((visiblePage) => (
        <Button
          aria-current={visiblePage === page ? "page" : undefined}
          aria-label={`Page ${visiblePage}`}
          key={visiblePage}
          onClick={() => onPageChange(visiblePage)}
          size="icon"
          variant={visiblePage === page ? "default" : "outline"}
        >
          {visiblePage}
        </Button>
      ))}
      <Button aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} size="icon" variant="outline">
        <ChevronRight className="size-[18px]" />
      </Button>
    </nav>
  );
}
