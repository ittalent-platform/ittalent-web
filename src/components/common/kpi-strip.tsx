import { cn } from "@/lib/utils";

import { Sparkline } from "./sparkline";

export type KpiItem = {
  key: string;
  label: string;
  /** Already formatted, e.g. "2,116". */
  value: string;
  /** One line under the number: what it means in plain words. */
  note: string;
  /** Longer wording of exactly what is counted, shown as a tooltip on the label. */
  hint?: string;
  /** Points of the trend; omitted when there is nothing to connect. */
  trend?: readonly number[];
};

const COLUMNS_CLASS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/** The row of big numbers at the top of a statistics page: label, number, trend and a plain-words note. */
export function KpiStrip({ items, label }: { items: readonly KpiItem[]; label: string }) {
  return (
    <section aria-label={label} className="surface-card overflow-hidden">
      {/* One pixel of gap over a line-coloured background draws the dividers, whatever the number of columns. */}
      <dl className={cn("m-0 grid grid-cols-1 gap-px bg-line-muted sm:grid-cols-2", COLUMNS_CLASS[items.length])}>
        {items.map((item) => (
          <div className="flex min-w-0 flex-col gap-2 bg-card px-[22px] py-[18px] sm:last:odd:col-span-2 lg:last:odd:col-span-1" key={item.key}>
            <dt className="text-[13px] font-semibold text-(--status-neutral-fg)" title={item.hint}>{item.label}</dt>
            <dd className="m-0 flex items-end justify-between gap-2.5">
              <span className="itt-display text-[36px] leading-none font-semibold tabular-nums text-foreground">{item.value}</span>
              {item.trend ? <Sparkline values={item.trend} /> : null}
            </dd>
            <dd className="m-0 text-[12.5px] text-muted-foreground">{item.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
