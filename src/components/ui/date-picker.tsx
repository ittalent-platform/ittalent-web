import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";

const DAYS_PER_WEEK = 7;
const MONTHS_PER_YEAR = 12;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Monday-first week, as used in Vietnam. 2024-01-01 is a Monday. */
const WEEK_START_SAMPLE = Date.UTC(2024, 0, 1);
const MS_PER_DAY = 86_400_000;

type Day = { year: number; month: number; day: number };

function parse(value?: string): Day | null {
  const match = value ? ISO_DATE.exec(value) : null;
  return match ? { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) } : null;
}

const pad = (value: number) => String(value).padStart(2, "0");
const toIso = ({ year, month, day }: Day) => `${year}-${pad(month + 1)}-${pad(day)}`;
const display = ({ year, month, day }: Day) => `${pad(day)}/${pad(month + 1)}/${year}`;

function localToday(): string {
  const now = new Date();
  return toIso({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate() });
}

/** Days of a month laid out Monday-first: leading blanks, then 1..n. */
function monthCells(year: number, month: number): (number | null)[] {
  const leading = (new Date(Date.UTC(year, month, 1)).getUTCDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;
  const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return [...Array.from<null>({ length: leading }).fill(null), ...Array.from({ length }, (_, index) => index + 1)];
}

export type DatePickerProps = {
  "aria-invalid"?: boolean;
  className?: string;
  clearable?: boolean;
  id?: string;
  /** Latest selectable date, `YYYY-MM-DD`. */
  max?: string;
  /** Earliest selectable date, `YYYY-MM-DD`. */
  min?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Today's date for the "Today" shortcut and the marker; defaults to the browser's local date. */
  today?: string;
  /** `YYYY-MM-DD`, or empty for no date. */
  value: string;
};

/**
 * Date field with a month-grid popover in the design-system style. Values are `YYYY-MM-DD` strings,
 * the same shape a native date input gives, so forms and query params need no conversion.
 */
export function DatePicker({
  "aria-invalid": invalid,
  className,
  clearable = false,
  id,
  max,
  min,
  onChange,
  placeholder,
  today: todayProp,
  value,
}: DatePickerProps) {
  const { t, i18n } = useTranslation();
  const today = todayProp ?? localToday();
  const selected = parse(value);
  const fallback = parse(today) ?? { year: 1970, month: 0, day: 1 };
  const initial = selected ?? fallback;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ year: initial.year, month: initial.month });

  const locale = i18n.language === "vi" ? "vi-VN" : "en-GB";
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(view.year, view.month, 1)),
  );
  const weekdays = Array.from({ length: DAYS_PER_WEEK }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(WEEK_START_SAMPLE + index * MS_PER_DAY)),
  );

  function shiftMonth(delta: number) {
    setView(({ year, month }) => {
      const index = year * MONTHS_PER_YEAR + month + delta;
      return { year: Math.floor(index / MONTHS_PER_YEAR), month: index % MONTHS_PER_YEAR };
    });
  }

  function choose(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  const disabled = (iso: string) => (min !== undefined && iso < min) || (max !== undefined && iso > max);
  const todayDisabled = disabled(today);

  return (
    <Popover
      onOpenChange={(next) => {
        if (next) setView({ year: initial.year, month: initial.month });
        setOpen(next);
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <button
          aria-invalid={invalid}
          className={cn(
            "flex h-[46px] w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card pl-3.5 pr-4.5 text-left text-[13.5px] text-foreground outline-none transition-colors",
            "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/20 aria-invalid:border-destructive",
            className,
          )}
          id={id}
          type="button"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? display(selected) : (placeholder ?? t("datePicker.placeholder"))}
          </span>
          <CalendarDays aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[292px] rounded-xl p-4">
        <div className="flex items-center justify-between pb-3">
          <span className="text-[14px] font-bold capitalize text-foreground">{monthLabel}</span>
          <div className="flex gap-1">
            <button
              aria-label={t("datePicker.previousMonth")}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => shiftMonth(-1)}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              aria-label={t("datePicker.nextMonth")}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => shiftMonth(1)}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center" role="grid">
          {weekdays.map((weekday) => (
            <span className="pb-1 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-subtle dark:text-muted-foreground" key={weekday}>
              {weekday}
            </span>
          ))}
          {monthCells(view.year, view.month).map((day, index) => {
            if (day === null) return <span key={`blank-${index}`} />;
            const iso = toIso({ ...view, day });
            const isSelected = iso === value;
            return (
              <button
                aria-label={display({ ...view, day })}
                aria-pressed={isSelected}
                className={cn(
                  "mx-auto grid size-9 cursor-pointer place-items-center rounded-lg text-[13.5px] text-foreground transition-colors hover:bg-muted",
                  iso === today && !isSelected && "border border-primary font-semibold",
                  isSelected && "bg-primary text-[14px] font-semibold text-primary-foreground hover:bg-primary",
                  disabled(iso) && "pointer-events-none cursor-default text-muted-foreground/40",
                )}
                disabled={disabled(iso)}
                key={iso}
                onClick={() => choose(iso)}
                type="button"
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between pt-3 text-[13px] font-semibold">
          {clearable && value ? (
            <button className="cursor-pointer text-fg-link hover:underline" onClick={() => choose("")} type="button">
              {t("datePicker.clear")}
            </button>
          ) : (
            <span />
          )}
          <button
            className="cursor-pointer text-fg-link hover:underline disabled:cursor-default disabled:text-muted-foreground/50 disabled:no-underline"
            disabled={todayDisabled}
            onClick={() => choose(today)}
            type="button"
          >
            {t("datePicker.today")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
