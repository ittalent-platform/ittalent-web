import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

/** The "Open Applications ›" link at the end of a card's title row. */
export function CardLink({ children, to }: { children: ReactNode; to: string }) {
  return (
    <Link className="inline-flex shrink-0 items-center gap-1 rounded-md text-[13px] font-semibold whitespace-nowrap text-fg-link transition hover:underline focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none" to={to}>
      {children}
      <ChevronRight aria-hidden className="size-3.5" />
    </Link>
  );
}
