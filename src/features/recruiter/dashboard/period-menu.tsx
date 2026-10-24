import { CalendarDays, Check, ChevronDown, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { daysBetween } from "@/lib/calendar-day";
import { formatDayRange, formatFullDay } from "@/lib/dashboard-format";
import { cn } from "@/lib/utils";

import { MAX_RANGE_DAYS, PRESET_RANGES, type DashboardRange } from "./dashboard.constants";
import { customRangeError, presetWindow } from "./dashboard.period";

type PeriodMenuProps = {
  /** The period the numbers on the page cover. */
  current: { from: string; range: DashboardRange; to: string };
  onCustom: (from: string, to: string) => void;
  onPreset: (range: DashboardRange) => void;
  /** Today in Ho Chi Minh City: the presets are worked out from it. */
  today: string;
};

/** The period button of the page: the presets, and a custom range with two dates. */
export function PeriodMenu({ current, onCustom, onPreset, today }: PeriodMenuProps) {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState({ from: current.from, to: current.to });
  const error = customRangeError(draft.from, draft.to);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (next) {
      setCustom(false);
      setDraft({ from: current.from, to: current.to });
    }
  }

  function chooseCustom() {
    if (error !== null) return;
    onCustom(draft.from, draft.to);
    setOpen(false);
  }

  const errorText =
    error === "order" ? t("dashboard.period.errors.order") : error === "tooLong" ? t("dashboard.period.errors.tooLong", { days: MAX_RANGE_DAYS }) : null;
  // The span is always positive when no error is shown, so the hint can say how many days the range covers.
  const days = error === null ? daysBetween(draft.from, draft.to) + 1 : null;

  return (
    <Popover onOpenChange={changeOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-label={t("dashboard.period.label")}
          className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 text-left text-[14px] outline-none transition hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-primary/30 data-[state=open]:border-primary"
          type="button"
        >
          <CalendarDays aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-semibold text-foreground">{t(`dashboard.period.${current.range}`)}</span>
          <span className="text-muted-foreground">{formatDayRange(current.from, current.to, language, { withYear: true })}</span>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className={cn("rounded-2xl p-2", custom ? "w-[340px] p-4" : "w-[320px]")}>
        {custom ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-[15px] font-bold text-foreground">{t("dashboard.period.custom")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["from", "to"] as const).map((field) => (
                <div className="flex min-w-0 flex-col gap-1.5" key={field}>
                  <label className="text-[13px] font-semibold text-foreground" htmlFor={`dashboard-period-${field}`}>
                    {t(`dashboard.period.${field}`)} <span aria-hidden className="text-primary">*</span>
                  </label>
                  <DatePicker
                    aria-invalid={error !== null && error !== "required"}
                    className="h-11 rounded-xl px-3 text-[14px]"
                    formatValue={(value) => formatFullDay(value, language)}
                    id={`dashboard-period-${field}`}
                    onChange={(value) => setDraft((previous) => ({ ...previous, [field]: value }))}
                    today={today}
                    value={draft[field]}
                  />
                </div>
              ))}
            </div>
            {errorText ? (
              <div className="flex items-start gap-2 rounded-xl border border-(--status-error-border) bg-(--status-error-bg) px-3 py-2.5 text-[13px] text-(--status-error-fg)" role="alert">
                <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>{errorText}</span>
              </div>
            ) : (
              <p className="m-0 text-[12.5px] text-muted-foreground">
                {t("dashboard.period.note")}
                {days !== null ? ` ${t("dashboard.period.days", { count: days })}` : ""}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button className="h-10 px-4 text-[14px] font-semibold" onClick={() => setCustom(false)} shape="xl" size="lg" variant="outline">
                {t("dashboard.period.cancel")}
              </Button>
              <Button className="h-10 px-5 text-[14px] font-semibold" disabled={error !== null} onClick={chooseCustom} shape="xl" size="lg">
                {t("dashboard.period.apply")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col" role="group" aria-label={t("dashboard.period.label")}>
            {PRESET_RANGES.map((range) => {
              const window = presetWindow(range, today);
              const active = current.range === range;
              return (
                <button
                  aria-pressed={active}
                  className={cn(
                    "flex h-10 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left text-[14px] text-foreground transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none",
                    active && "bg-muted",
                  )}
                  key={range}
                  onClick={() => {
                    onPreset(range);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <span aria-hidden className="grid size-4 shrink-0 place-items-center text-primary">
                    {active ? <Check className="size-4" /> : null}
                  </span>
                  <span className={cn("grow", active && "font-semibold")}>{t(`dashboard.period.${range}`)}</span>
                  <span className="text-[12.5px] text-muted-foreground">{formatDayRange(window.from, window.to, language)}</span>
                </button>
              );
            })}
            <div className="my-1.5 border-t border-border" />
            <button
              aria-pressed={current.range === "custom"}
              className={cn(
                "flex h-10 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left text-[14px] text-foreground transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none",
                current.range === "custom" && "bg-muted font-semibold",
              )}
              onClick={() => setCustom(true)}
              type="button"
            >
              <CalendarDays aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              {t("dashboard.period.customOpen")}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
