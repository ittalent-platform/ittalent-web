import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ChecklistOption<T extends string> = { value: T; label: string; count?: number; dotClass?: string };
export type ChecklistPreset<T extends string> = { label: string; values: readonly T[] };

/**
 * Multi-select filter in a popover with quick presets. An empty selection means "no filter"
 * (every box shows ticked); ticking every box returns to that state, and the last box cannot be cleared.
 */
export function ChecklistPopover<T extends string>({
  caption,
  footerHint,
  label,
  onChange,
  options,
  presets,
  selectAllLabel,
  showCounts = true,
  triggerValue,
  values,
}: {
  caption: string;
  footerHint: string;
  label: string;
  onChange: (values: T[]) => void;
  options: ChecklistOption<T>[];
  presets: ChecklistPreset<T>[];
  selectAllLabel: string;
  showCounts?: boolean;
  triggerValue: string;
  values: readonly T[];
}) {
  const { t } = useTranslation();
  const all = options.map((option) => option.value);
  const effective: readonly T[] = values.length ? values : all;
  const isAll = effective.length === all.length;

  function commit(next: readonly T[]) {
    onChange(next.length === all.length ? [] : [...next]);
  }

  function toggle(value: T) {
    const next = effective.includes(value) ? effective.filter((item) => item !== value) : [...effective, value];
    if (next.length) commit(next);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-haspopup="dialog"
          className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-[7px] rounded-md border border-border bg-card px-[15px] text-[13.5px] text-muted-foreground outline-none data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/20"
          type="button"
        >
          {label} <span className="font-semibold text-foreground">{triggerValue}</span>
          <span className="pb-px">▾</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={label} className="w-[300px] rounded-xl p-0">
        <div className="flex flex-wrap gap-1.5 border-b border-line-muted p-3">
          {presets.map((preset) => {
            const active = preset.values.length === effective.length && preset.values.every((value) => effective.includes(value));
            return (
              <button
                aria-pressed={active}
                className={cn("h-7 cursor-pointer rounded-full border px-3 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary/40", active ? "border-foreground bg-foreground text-background" : "border-(--border-strong) bg-card text-foreground hover:bg-muted")}
                key={preset.label}
                onClick={() => commit(preset.values)}
                type="button"
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="p-2">
          <p className="px-2 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{caption}</p>
          {options.map((option) => {
            const checked = effective.includes(option.value);
            return (
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[13.5px] hover:bg-muted" key={option.value}>
                <input checked={checked} className="peer sr-only" onChange={() => toggle(option.value)} type="checkbox" />
                <span aria-hidden className={cn("grid size-[18px] shrink-0 place-items-center rounded-[5px] border-[1.5px] peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40", checked ? "border-foreground bg-foreground text-background" : "border-(--line-dashed) bg-card")}>
                  {checked ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                {option.dotClass ? <span aria-hidden className={cn("size-2 rounded-full", option.dotClass)} /> : null}
                <span className="flex-1 text-foreground">{option.label}</span>
                {showCounts && option.count !== undefined ? <span className="itt-mono text-xs text-muted-foreground">{option.count}</span> : null}
              </label>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-line-muted px-4 py-2.5 text-xs">
          <button className="cursor-pointer font-semibold text-fg-link hover:underline disabled:cursor-default disabled:opacity-50" disabled={isAll} onClick={() => onChange([])} type="button">{selectAllLabel}</button>
          <span className="text-muted-foreground">{footerHint}</span>
        </div>
        <span className="sr-only">{t("applications.filter.appliesRightAway")}</span>
      </PopoverContent>
    </Popover>
  );
}
