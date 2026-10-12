import type { ReactNode } from "react";

/** Grey summary box: label on the left, value on the right, one row each (e.g. Email / Role / Company). */
export function KeyValueBox({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="m-0 flex flex-col gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3.5 text-[13.5px]">
      {rows.map((row) => (
        <div className="flex items-baseline justify-between gap-4" key={row.label}>
          <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
          <dd className="m-0 min-w-0 text-right font-semibold break-all text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
