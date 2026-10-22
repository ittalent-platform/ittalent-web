import type { CompanyDashboardResponse } from "@/api/generated/types.gen";
import { addDays, mondayOf, weekdayIndex } from "@/lib/calendar-day";
import { RECRUITER_APPLICATIONS_PATH } from "@/config/routes";

import {
  DAYS_PER_WEEK,
  HEAT_MAX_LEVEL,
  HEATMAP,
  IN_PROGRESS_KEYS,
  MIN_CHART_TOP,
  NICE_TOP_STEPS,
  PIPELINE_SEGMENTS,
  STATUS_LIST_SEPARATOR,
  type PipelineKey,
} from "./dashboard.constants";

type Statuses = CompanyDashboardResponse["applicationStatuses"];

// ---- where this period's applications are now ----

export type PipelineSegment = (typeof PIPELINE_SEGMENTS)[number] & { count: number; share: number };

export type PipelineModel = {
  segments: PipelineSegment[];
  closed: number;
  closedShare: number;
  inProgress: number;
  hired: number;
};

/** The bar and the legend from the same eight counts, so they cannot disagree. */
export function pipelineModel(statuses: Statuses, total: number): PipelineModel {
  const share = (count: number) => (total > 0 ? count / total : 0);
  const closed = statuses.rejected + statuses.withdrawn + statuses.positionFilled;
  return {
    closed,
    closedShare: share(closed),
    hired: statuses.hired,
    inProgress: IN_PROGRESS_KEYS.reduce((sum: number, key: PipelineKey) => sum + statuses[key], 0),
    segments: PIPELINE_SEGMENTS.map((segment) => ({ ...segment, count: statuses[segment.key], share: share(statuses[segment.key]) })),
  };
}

/** The applications list for some statuses, limited to the dashboard's period, so the list holds the numbers on the card. */
export function applicationsListPath(apiStatuses: readonly string[], period: { from: string; to: string }): string {
  const query = new URLSearchParams({ from: period.from, range: "custom", status: apiStatuses.join(STATUS_LIST_SEPARATOR), to: period.to });
  return `${RECRUITER_APPLICATIONS_PATH}?${query.toString()}`;
}

// ---- applications received per week ----

/** The top of a bar chart's axis: the smallest "round" number (2, 4, 6, 8, 10, 20, 40 …) that fits every value. */
export function niceTop(max: number): number {
  if (max <= MIN_CHART_TOP) return MIN_CHART_TOP;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  for (const step of NICE_TOP_STEPS) {
    if (step * magnitude >= max) return step * magnitude;
  }
  return magnitude * 10 * NICE_TOP_STEPS[0];
}

// ---- when interviews happen ----

export type HeatCell = { count: number; date: string; level: number };
export type HeatColumn = { cells: (HeatCell | null)[]; monday: string };

export function heatLevel(count: number): number {
  return Math.min(Math.max(count, 0), HEAT_MAX_LEVEL);
}

/**
 * The interview calendar: one column per week, Monday first, from the Monday of the first day to the Sunday of the last.
 * Days outside the period are empty slots, so a partial first or last week keeps its weekdays aligned.
 */
export function heatmapColumns(days: readonly { count: number; date: string }[], from: string, to: string): HeatColumn[] {
  const counts = new Map(days.map((day) => [day.date, day.count]));
  const columns: HeatColumn[] = [];
  for (let monday = mondayOf(from); monday <= to; monday = addDays(monday, DAYS_PER_WEEK)) {
    const cells = Array.from({ length: DAYS_PER_WEEK }, (_unused, index): HeatCell | null => {
      const date = addDays(monday, index);
      if (date < from || date > to) return null;
      const count = counts.get(date) ?? 0;
      return { count, date, level: heatLevel(count) };
    });
    columns.push({ cells, monday });
  }
  return columns;
}

/** Interviews per weekday over the whole period, Monday first. */
export function weekdayTotals(days: readonly { count: number; date: string }[]): number[] {
  const totals = Array.from({ length: DAYS_PER_WEEK }, () => 0);
  for (const day of days) {
    const index = weekdayIndex(day.date);
    totals[index] = (totals[index] ?? 0) + day.count;
  }
  return totals;
}

/** The weekday with the most interviews, or null when nothing happened or several days tie. */
export function busiestWeekday(totals: readonly number[]): number | null {
  const max = Math.max(...totals);
  if (max <= 0) return null;
  const peaks = totals.flatMap((total, index) => (total === max ? [index] : []));
  return peaks.length === 1 ? (peaks[0] ?? null) : null;
}

/** How often a column label is printed: every Monday when there are few columns, fewer as they get crowded. */
export function columnLabelEvery(columns: number): number {
  if (columns <= HEATMAP.denseColumns) return 1;
  return columns <= HEATMAP.sparseColumns ? 2 : 4;
}

// ---- the page as a whole ----

/** Nothing was posted, received or scheduled in the period. */
export function isEmptyPeriod(data: CompanyDashboardResponse): boolean {
  return data.summary.applicationsReceived === 0 && data.summary.jobsPosted === 0 && data.summary.interviews === 0;
}
