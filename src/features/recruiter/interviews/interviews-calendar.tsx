import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { CalendarChip } from "./calendar-chip";
import { CalendarDayDialog } from "./calendar-day-dialog";
import { CalendarFieldsMenu } from "./calendar-fields-menu";
import { groupByDay, monthTitle, shiftMonth, weekdayNames, type CalendarDay } from "./interviews.calendar";
import { CALENDAR_CHIPS_PER_DAY, type CalendarField, type InterviewItem } from "./interviews.constants";
import { vietnamDay } from "./interviews.format";

type InterviewsCalendarProps = {
  currentMonth: string;
  days: CalendarDay[];
  fields: ReadonlySet<CalendarField>;
  isLoading: boolean;
  items: InterviewItem[];
  month: string;
  onFieldToggle: (field: CalendarField) => void;
  onMonthChange: (month: string) => void;
};

const NAV_BUTTON = "grid size-9 place-items-center rounded-lg text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40";

/** A month of interviews as a Sunday-to-Saturday grid, in Vietnam time. */
export function InterviewsCalendar({ currentMonth, days, fields, isLoading, items, month, onFieldToggle, onMonthChange }: InterviewsCalendarProps) {
  const { t, i18n } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);
  const [dayOpen, setDayOpen] = useState<string | null>(null);

  const byDay = useMemo(() => groupByDay(items), [items]);
  const weekdays = useMemo(() => weekdayNames(i18n.language), [i18n.language]);
  const today = vietnamDay(new Date());
  const title = monthTitle(month, i18n.language);

  return (
    <section aria-label={title} className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-4">
        <h2 className="itt-display text-[19px] font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-1">
          <CalendarFieldsMenu fields={fields} onToggle={onFieldToggle} />
          <span aria-hidden className="mx-2 h-5 w-px bg-border" />
          <button aria-label={t("interviews.calendar.previous")} className={NAV_BUTTON} onClick={() => onMonthChange(shiftMonth(month, -1))} type="button">
            <ChevronLeft className="size-4" />
          </button>
          <button
            className="h-9 cursor-pointer rounded-lg px-3 text-[13px] font-medium text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => onMonthChange(currentMonth)}
            type="button"
          >
            {t("interviews.calendar.today")}
          </button>
          <button aria-label={t("interviews.calendar.next")} className={NAV_BUTTON} onClick={() => onMonthChange(shiftMonth(month, 1))} type="button">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div aria-busy={isLoading} className="min-w-[860px]">
          <div className="grid grid-cols-7 border-y border-border" role="row">
            {weekdays.map((name) => (
              <div className="py-2.5 text-center text-[12.5px] font-semibold text-foreground" key={name} role="columnheader">
                {name}
              </div>
            ))}
          </div>

          <div className={cn("grid grid-cols-7 transition-opacity", isLoading && "opacity-50")}>
            {days.map((cell) => {
              const interviews = byDay.get(cell.day) ?? [];
              const hidden = interviews.length - CALENDAR_CHIPS_PER_DAY;
              return (
                <div
                  className={cn("flex min-h-30 min-w-0 flex-col gap-1 border-b border-r border-border p-1.5 nth-[7n]:border-r-0", !cell.inMonth && "bg-muted/40")}
                  data-day={cell.day}
                  key={cell.day}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center self-end rounded-full text-[12.5px]",
                      cell.day === today ? "bg-primary font-bold text-primary-foreground" : cell.inMonth ? "text-foreground" : "text-muted-foreground/60",
                    )}
                  >
                    {cell.dayOfMonth}
                  </span>
                  {interviews.slice(0, CALENDAR_CHIPS_PER_DAY).map((interview) => (
                    <CalendarChip fields={fields} interview={interview} key={interview.id} onOpenChange={(open) => setOpenId(open ? interview.id : null)} open={openId === interview.id} />
                  ))}
                  {hidden > 0 ? (
                    <button
                      className="cursor-pointer self-start rounded px-2 text-left text-[12px] font-semibold text-fg-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary/40"
                      onClick={() => setDayOpen(cell.day)}
                      type="button"
                    >
                      {t("interviews.calendar.more", { count: hidden })}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {dayOpen ? <CalendarDayDialog day={dayOpen} interviews={byDay.get(dayOpen) ?? []} onOpenChange={(open) => !open && setDayOpen(null)} /> : null}
    </section>
  );
}
