import type { ReactNode } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Radix Select cannot hold an empty value, so the "all" choice travels as this sentinel. */
const ALL = "__all__";

const VARIANTS = {
  /** Search bar field. */
  field: "h-12 w-full rounded-xl border-mkt-line bg-white text-sm text-mkt-ink",
  /** Sidebar filter. */
  compact: "h-11 w-full rounded-xl border-mkt-line bg-white text-[13.5px] text-mkt-ink",
  /** Sort control beside a result count. */
  pill: "h-9 w-auto min-w-[120px] gap-2 rounded-full border-mkt-line-strong bg-white text-[13px] font-semibold text-mkt-ink",
} as const;

export type MarketSelectOption = { label: string; value: string };

/**
 * Dropdown for the public marketplace pages. It wraps the shared Select, so the open menu, highlight,
 * check mark and chevron spacing match every other dropdown in the app. An empty `value` means "all".
 */
export function MarketSelect({
  allLabel,
  ariaLabel,
  className,
  icon,
  onChange,
  options,
  value,
  variant = "field",
}: {
  /** Label of the empty choice ("All cities"); omit when every option is a real value. */
  allLabel?: string;
  ariaLabel: string;
  className?: string;
  icon?: ReactNode;
  onChange: (value: string) => void;
  options: readonly MarketSelectOption[];
  value: string;
  variant?: keyof typeof VARIANTS;
}) {
  return (
    <Select onValueChange={(next) => onChange(next === ALL ? "" : next)} value={value === "" && allLabel ? ALL : value}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(VARIANTS[variant], "focus-visible:border-mkt-accent data-[state=open]:border-mkt-accent", className)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {icon ? <span className="shrink-0 text-mkt-muted">{icon}</span> : null}
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        {allLabel ? <SelectItem value={ALL}>{allLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
