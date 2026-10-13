import { Columns3, Table2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ViewMode = "table" | "board";

type ViewToggleOption<T extends string> = {
  icon: LucideIcon;
  label: string;
  value: T;
};

const DEFAULT_OPTIONS: ViewToggleOption<ViewMode>[] = [
  { icon: Table2, label: "Table", value: "table" },
  { icon: Columns3, label: "Board", value: "board" },
];

export function ViewToggle<T extends string = ViewMode>({
  onChange,
  options = DEFAULT_OPTIONS as ViewToggleOption<T>[],
  showLabels = false,
  value,
}: {
  onChange: (value: T) => void;
  options?: ViewToggleOption<T>[];
  /** Write each option's label beside its icon; the selected option is then filled itself, as the options differ in width. */
  showLabels?: boolean;
  value: T;
}) {
  if (options.length === 0) {
    return null;
  }

  if (showLabels) {
    return (
      <div className="inline-flex rounded-full border border-(--border-strong) bg-card p-1" role="group">
        {options.map((option) => {
          const isSelected = option.value === value;
          const Icon = option.icon;

          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-[13.5px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/40",
                isSelected ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <Icon aria-hidden className="size-4" />
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );

  return (
    <div
      className="relative inline-grid rounded-full border border-border-strong bg-card p-1"
      role="group"
      /* dynamic: runtime value */
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-foreground transition-transform duration-200 ease-out motion-reduce:transition-none"
        /* dynamic: runtime value */
        style={{
          transform: `translateX(${selectedIndex * 100}%)`,
          width: `calc(${100 / options.length}% - 4px)`,
        }}
      />
      {options.map((option) => {
        const isSelected = option.value === value;
        const Icon = option.icon;

        return (
          <button
            aria-label={option.label}
            aria-pressed={isSelected}
            className={cn(
              "relative z-10 inline-flex h-9 w-11 items-center justify-center rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/40",
              isSelected ? "text-background" : "text-muted-foreground hover:text-foreground",
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            title={option.label}
            type="button"
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
