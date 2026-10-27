import { Link } from "react-router";

import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/dashboard-format";

import { TONE_SWATCH_CLASS, type ChartTone } from "./chart-tone";

export type LegendRow = {
  key: string;
  label: string;
  count: number;
  /** Whole percentage of the chart's total. */
  percent: number;
  tone: ChartTone;
  /** Makes the row a link to the list behind the number. */
  href?: string;
};

/** The rows beside a ring: swatch, label, count and share. A row is a link only when the list it opens shows the same records. */
export function ChartLegend({ language, rows }: { language: string; rows: readonly LegendRow[] }) {
  return (
    <ul className="m-0 flex min-w-0 grow list-none flex-col p-0">
      {rows.map((row) => {
        const content = (
          <>
            <span aria-hidden className={cn("size-3 shrink-0 rounded-[3px]", TONE_SWATCH_CLASS[row.tone])} />
            <span className="grow truncate text-(--status-neutral-fg)">{row.label}</span>
            <b className="tabular-nums">{formatCount(row.count, language)}</b>
            <span className="w-[38px] text-right tabular-nums text-(--dash-axis)">{row.percent}%</span>
          </>
        );
        const className = "flex h-[34px] items-center gap-[9px] border-t border-(--dash-track) text-[13px] text-foreground";
        return (
          <li key={row.key}>
            {row.href ? (
              <Link className={cn(className, "transition hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none")} to={row.href}>
                {content}
              </Link>
            ) : (
              <div className={className}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
