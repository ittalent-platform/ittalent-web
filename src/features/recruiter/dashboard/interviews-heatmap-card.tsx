import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { CompanyDashboardResponse } from "@/api/generated/types.gen";
import { CardLink } from "@/components/common/card-link";
import { SectionCard } from "@/components/common/section-card";
import { RECRUITER_INTERVIEWS_PATH } from "@/config/routes";
import { addDays } from "@/lib/calendar-day";
import { formatCount, formatDayRange, formatShortDay, formatWeekdayInitial, formatWeekdayShort } from "@/lib/dashboard-format";
import { cn } from "@/lib/utils";

import {
  HEAT_LEVEL_CLASS,
  HEATMAP,
  WEEKDAY_BAR_EMPTY_HEIGHT,
  WEEKDAY_BAR_MAX_HEIGHT,
  WEEKDAY_KEYS,
} from "./dashboard.constants";
import { busiestWeekday, columnLabelEvery, heatmapColumns, weekdayTotals, type HeatCell } from "./dashboard.derive";

// A Monday, so the seven narrow weekday labels can be printed in the language of the page.
const SAMPLE_MONDAY = "2024-01-01";
// The grid is 26px squares with 4px between them under a 16px label row (see HEATMAP); the tooltip is placed from the same numbers.
const LABEL_ROW_HEIGHT = 20;
const TOOLTIP_GAP = 6;
const HALF = 2;
const HEAT_LEGEND_LEVELS = [0, 1, 2, 3, 4] as const;

/** When interviews start: a calendar of the period (one square a day, darker is busier) and the total per weekday. */
export function InterviewsHeatmapCard({ data }: { data: CompanyDashboardResponse }) {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const { interviewDays, period } = data;
  const [active, setActive] = useState<{ cell: HeatCell; column: number; row: number } | null>(null);

  const columns = heatmapColumns(interviewDays, period.from, period.to);
  const labelEvery = columnLabelEvery(columns.length);
  const totals = weekdayTotals(interviewDays);
  const peak = Math.max(...totals);
  const busiest = busiestWeekday(totals);
  const weekdayInitials = WEEKDAY_KEYS.map((_key, index) => formatWeekdayInitial(addDays(SAMPLE_MONDAY, index), language));
  const pitch = HEATMAP.cell + HEATMAP.gap;
  const cellText = (cell: HeatCell) =>
    t("dashboard.heatmap.cell", { count: cell.count, day: `${formatWeekdayShort(cell.date, language)} ${formatShortDay(cell.date, language)}` });

  return (
    <SectionCard
      actions={<CardLink to={RECRUITER_INTERVIEWS_PATH}>{t("dashboard.heatmap.open")}</CardLink>}
      description={t("dashboard.heatmap.subtitle", { range: formatDayRange(period.from, period.to, language) })}
      id="dashboard-heatmap"
      title={t("dashboard.heatmap.title")}
    >
      <div className="flex flex-wrap items-start gap-x-9 gap-y-5">
        <div className="max-w-full overflow-x-auto pb-1">
          <div className="flex gap-1">
            <div className="flex flex-col gap-1 pt-5">
              {weekdayInitials.map((initial, index) => (
                <span aria-hidden className="flex h-[26px] items-center text-[10.5px] text-(--dash-axis)" key={WEEKDAY_KEYS[index]}>
                  {initial}
                </span>
              ))}
            </div>
            <div className="relative flex gap-1" onMouseLeave={() => setActive(null)}>
              {columns.map((column, columnIndex) => (
                <div className="flex flex-col items-center gap-1" key={column.monday}>
                  <span aria-hidden className="h-4 text-[10.5px] whitespace-nowrap text-(--dash-axis)">
                    {columnIndex % labelEvery === 0 ? formatShortDay(column.monday, language) : ""}
                  </span>
                  {column.cells.map((cell, rowIndex) =>
                    cell ? (
                      <button
                        aria-label={cellText(cell)}
                        className={cn("size-[26px] cursor-default rounded-md outline-none focus-visible:ring-2 focus-visible:ring-foreground", HEAT_LEVEL_CLASS[cell.level])}
                        key={cell.date}
                        onBlur={() => setActive(null)}
                        onFocus={() => setActive({ cell, column: columnIndex, row: rowIndex })}
                        onMouseEnter={() => setActive({ cell, column: columnIndex, row: rowIndex })}
                        type="button"
                      />
                    ) : (
                      <span aria-hidden className="size-[26px]" key={`${column.monday}-${rowIndex}`} />
                    ),
                  )}
                </div>
              ))}
              {active ? (
                <span
                  className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-foreground px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap text-background shadow-lg"
                  role="tooltip"
                  style={{
                    left: active.column * pitch + HEATMAP.cell / HALF,
                    top: LABEL_ROW_HEIGHT + active.row * pitch - TOOLTIP_GAP,
                  }} /* dynamic: runtime value */
                >
                  {cellText(active.cell)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex min-w-[150px] grow flex-col gap-2">
          <h3 className="text-[12px] font-bold tracking-[0.06em] text-(--slate-faint) uppercase">{t("dashboard.heatmap.byWeekday")}</h3>
          <div className="flex h-[132px] items-end gap-1.5">
            {totals.map((total, index) => (
              <div className="flex h-full flex-1 flex-col items-center justify-end gap-1" key={WEEKDAY_KEYS[index]}>
                <span className={cn("text-[11px] font-bold tabular-nums", total === 0 ? "text-(--dash-axis)" : "text-foreground")}>{formatCount(total, language)}</span>
                <span
                  className={cn("w-full max-w-[18px] rounded-t-[4px]", total === 0 ? "bg-(--dash-weekday-zero)" : total === peak ? "bg-brand" : "bg-(--dash-weekday)")}
                  style={{ height: total === 0 ? WEEKDAY_BAR_EMPTY_HEIGHT : Math.max(WEEKDAY_BAR_EMPTY_HEIGHT, Math.round((total / peak) * WEEKDAY_BAR_MAX_HEIGHT)) }} /* dynamic: runtime value */
                />
                <span aria-hidden className="text-[10.5px] text-(--dash-axis)">{weekdayInitials[index]}</span>
              </div>
            ))}
          </div>
          {busiest !== null ? (
            <p className="m-0 text-[12px] text-(--status-neutral-fg)">
              {t("dashboard.heatmap.busiest")} <b>{t(`dashboard.heatmap.busiestDay.${WEEKDAY_KEYS[busiest]}`)}</b>
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-(--dash-axis)">
        {t("dashboard.heatmap.fewer")}
        {HEAT_LEGEND_LEVELS.map((level) => (
          <span aria-hidden className={cn("size-3 rounded-[3px]", HEAT_LEVEL_CLASS[level])} key={level} />
        ))}
        {t("dashboard.heatmap.more")}
      </div>
    </SectionCard>
  );
}
