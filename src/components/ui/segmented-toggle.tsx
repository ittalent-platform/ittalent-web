import { cn } from "@/lib/utils"

type SegmentedToggleOption<T extends string> = {
  label: string
  tone?: "danger" | "neutral" | "primary" | "success"
  value: T
}

type SegmentedToggleProps<T extends string> = {
  disabled?: boolean
  onChange: (value: T) => void
  options: SegmentedToggleOption<T>[]
  value: T
}

const SPECIAL_TONE_VALUES = new Set(["active", "suspended", "admin", "applicant"])

export function SegmentedToggle<T extends string>({
  disabled,
  onChange,
  options,
  value,
}: SegmentedToggleProps<T>) {
  const hasSpecialTone = options.some((option) => SPECIAL_TONE_VALUES.has(option.value))

  if (!hasSpecialTone) {
    const activeIndex = Math.max(
      options.findIndex((option) => option.value === value),
      0,
    )

    return (
      <div
        className={cn(
          "relative inline-grid rounded-full border border-(--border-strong) bg-card p-1",
          disabled && "pointer-events-none opacity-50",
        )}
        role="group"
        /* dynamic: runtime value */
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden
          className="absolute inset-y-1 rounded-full bg-foreground shadow-sm transition-transform duration-200 ease-out"
          /* dynamic: runtime value */
          style={{
            left: 4,
            transform: `translateX(${activeIndex * 100}%)`,
            width: `calc((100% - 8px) / ${options.length})`,
          }}
        />
        {options.map((option) => {
          const isSelected = option.value === value

          return (
            <button
              key={option.value}
              aria-pressed={isSelected}
              className={cn(
                "relative z-10 grid h-9 place-items-center rounded-full px-4 text-[13.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
                isSelected ? "font-semibold text-background" : "text-muted-foreground hover:text-foreground",
              )}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="inline-flex gap-2" role="group">
      {options.map((option) => {
        const isSelected = option.value === value
        const tone = option.tone === "success" || (!option.tone && option.value === "active")
            ? "border-(--status-success-fg) bg-(--status-success-bg) text-(--status-success-fg)"
            : option.tone === "danger" || (!option.tone && option.value === "suspended")
              ? "border-destructive bg-destructive/10 text-destructive"
            : option.tone === "primary" || (!option.tone && option.value === "admin")
              ? "border-primary bg-accent text-(--status-peach-fg)"
              : option.tone === "neutral" || (!option.tone && option.value === "applicant")
                ? "border-(--status-neutral-fg) bg-(--status-neutral-bg) text-(--status-neutral-fg)"
                : ""

        return (
          <button
            key={option.value}
            aria-pressed={isSelected}
            className={cn(
              "grid h-[42px] flex-1 place-items-center rounded-md border px-4 text-[13.5px] font-medium transition-colors",
              isSelected
                ? cn("border-[1.5px] font-semibold", tone || "border-(--border-strong) bg-card text-muted-foreground")
                : "border-(--border-strong) bg-card text-muted-foreground hover:bg-muted",
              disabled && "pointer-events-none opacity-50",
            )}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
