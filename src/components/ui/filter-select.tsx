import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
import { useMemo, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

type FilterSelectOption<T extends string> = {
  label: string
  menuLabel?: string
  value: T
}

type FilterSelectProps<T extends string> = {
  align?: "start" | "end"
  className?: string
  contentClassName?: string
  onChange: (value: T) => void
  options: FilterSelectOption<T>[]
  placeholder?: string
  /** Custom trigger content, e.g. a muted "Status:" prefix before the emphasised value. */
  renderTrigger?: (selectedLabel: string) => ReactNode
  searchable?: boolean
  size?: "md" | "sm"
  value: T
}

export function FilterSelect<T extends string>({
  align = "start",
  className,
  contentClassName,
  onChange,
  options,
  placeholder,
  renderTrigger,
  searchable = false,
  size = "md",
  value,
}: FilterSelectProps<T>) {
  const { t } = useTranslation()
  const placeholderLabel = placeholder ?? t("filterSelect.all")
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = options.find((option) => option.value === value)
  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return options
    }

    return options.filter((option) =>
      `${option.label} ${option.menuLabel ?? ""}`.toLowerCase().includes(normalizedQuery),
    )
  }, [options, query])

  if (searchable) {
    return (
      <div className="relative w-full">
        <div
          className={cn(
            "inline-flex flex-[0_0_auto] cursor-text items-center gap-[7px] rounded-md border border-solid border-border bg-card font-normal leading-normal tracking-normal text-muted-foreground outline-none",
            open && "border-primary ring-2 ring-primary/20",
            size === "sm" ? "h-9 gap-1.5 px-3 text-[13px]" : "h-11 px-[15px] py-px text-[13.5px]",
            className,
          )}
          onMouseDown={(event) => {
            if (event.target !== inputRef.current) {
              event.preventDefault()
              inputRef.current?.focus()
            }
            setOpen(true)
          }}
        >
          <input
            ref={inputRef}
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            onBlur={() => window.setTimeout(() => setOpen(false), 100)}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => {
              setQuery("")
              setOpen(true)
            }}
            placeholder={selected ? undefined : placeholderLabel}
            value={open ? query : selected?.label ?? ""}
          />
          <span className="pb-px text-muted-foreground">▾</span>
        </div>

        {open ? (
          <div
            className={cn(
              "absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-card py-0 shadow-lg",
              contentClassName,
            )}
          >
            {visibleOptions.map((option) => (
              <button
                key={option.value}
                className={cn(
                  "flex w-full cursor-pointer items-center border-t border-border px-3.5 py-2.5 text-left text-[13.5px] outline-none first:border-t-0 hover:bg-muted",
                  size === "sm" && "px-3 py-2 text-[13px]",
                  option.value === value ? "font-semibold text-primary" : "text-foreground",
                )}
                onMouseDown={(event) => {
                  event.preventDefault()
                  onChange(option.value)
                  setQuery("")
                  setOpen(false)
                }}
                type="button"
              >
                {option.menuLabel ?? option.label}
              </button>
            ))}
            {visibleOptions.length === 0 ? (
              <div className="px-3.5 py-3 text-[13.5px] text-muted-foreground">{t("filterSelect.noResults")}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <DropdownMenuPrimitive.Root onOpenChange={(nextOpen) => setOpen(nextOpen)}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          className={cn(
            "inline-flex flex-[0_0_auto] cursor-pointer items-center gap-[7px] rounded-md border border-solid border-border bg-card font-normal leading-normal tracking-normal text-muted-foreground outline-none data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
            size === "sm" ? "h-9 gap-1.5 px-3 text-[13px]" : "h-11 px-[15px] py-px text-[13.5px]",
            className,
          )}
          type="button"
        >
          {renderTrigger ? renderTrigger(selected?.label ?? placeholderLabel) : (selected?.label ?? placeholderLabel)}
          <span className="pb-px text-muted-foreground">▾</span>
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          className={cn(
            "z-50 w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden rounded-md border border-border bg-card py-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            size === "sm" ? "min-w-[4.5rem]" : "min-w-[8.5rem]",
            contentClassName,
          )}
          collisionPadding={16}
          sideOffset={6}
        >
          {visibleOptions.map((option) => (
            <DropdownMenuPrimitive.Item
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center border-t border-border px-3.5 py-2.5 text-[13.5px] outline-none select-none first:border-t-0 data-[highlighted]:bg-muted",
                size === "sm" && "px-3 py-2 text-[13px]",
                option.value === value ? "font-semibold text-primary" : "text-foreground",
              )}
              onSelect={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              {option.menuLabel ?? option.label}
            </DropdownMenuPrimitive.Item>
          ))}
          {visibleOptions.length === 0 ? (
            <div className="px-3.5 py-3 text-[13.5px] text-muted-foreground">{t("filterSelect.noResults")}</div>
          ) : null}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}

type FilterMultiSelectProps<T extends string> = {
  allLabel?: string
  baseLabel?: string
  className?: string
  contentClassName?: string
  onChange: (values: T[]) => void
  options: FilterSelectOption<T>[]
  placeholder?: string
  size?: "md" | "sm"
  values: T[]
}

export function FilterMultiSelect<T extends string>({
  allLabel,
  baseLabel,
  className,
  contentClassName,
  onChange,
  options,
  placeholder,
  size = "md",
  values,
}: FilterMultiSelectProps<T>) {
  const { t } = useTranslation()
  const placeholderLabel = placeholder ?? t("filterSelect.all")
  const baseLabelText = baseLabel ?? t("filterSelect.filter")
  const label = values.length === 0
    ? placeholderLabel
    : values.length === 1
      ? options.find((option) => option.value === values[0])?.label ?? placeholderLabel
      : `${baseLabelText} (${values.length})`

  function toggle(value: T) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          className={cn(
            "inline-flex flex-[0_0_auto] cursor-pointer items-center gap-[7px] rounded-md border border-solid border-(--border-strong) bg-card font-normal leading-normal tracking-normal text-muted-foreground outline-none data-[state=open]:border-primary",
            size === "sm" ? "h-9 gap-1.5 px-3 text-[13px]" : "h-11 px-[15px] py-px text-[13.5px]",
            className,
          )}
          type="button"
        >
          {label}
          <span className="pb-px text-muted-foreground">▾</span>
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="start"
          className={cn(
            "z-50 w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden rounded-md border border-border bg-card py-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            size === "sm" ? "min-w-[4.5rem]" : "min-w-[8.5rem]",
            contentClassName,
          )}
          collisionPadding={16}
          sideOffset={6}
        >
          <DropdownMenuPrimitive.Item
            className={cn(
              "flex cursor-pointer items-center border-t border-border px-3.5 py-2.5 text-[13.5px] outline-none select-none first:border-t-0 data-[highlighted]:bg-muted",
              size === "sm" && "px-3 py-2 text-[13px]",
              values.length === 0 ? "font-semibold text-primary" : "text-foreground",
            )}
            onSelect={(event) => {
              event.preventDefault()
              onChange([])
            }}
          >
            {allLabel ?? t("filterSelect.all")}
          </DropdownMenuPrimitive.Item>
          {options.map((option) => (
            <DropdownMenuPrimitive.Item
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 border-t border-border px-3.5 py-2.5 text-[13.5px] outline-none select-none first:border-t-0 data-[highlighted]:bg-muted",
                size === "sm" && "px-3 py-2 text-[13px]",
                values.includes(option.value) ? "font-semibold text-primary" : "text-foreground",
              )}
              onSelect={(event) => {
                event.preventDefault()
                toggle(option.value)
              }}
            >
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded border border-(--border-strong) text-[10px] leading-none",
                  values.includes(option.value) && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {values.includes(option.value) ? "✓" : null}
              </span>
              {option.menuLabel ?? option.label}
            </DropdownMenuPrimitive.Item>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
