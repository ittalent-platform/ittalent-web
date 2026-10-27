import type { GetApiV1DashboardCompanyData } from "@/api/generated/types.gen";
import { addDays, daysBetween, isCalendarDay } from "@/lib/calendar-day";
import { ictDayKey } from "@/lib/format";

import {
  DASHBOARD_PARAMS,
  DASHBOARD_RANGES,
  DASHBOARD_TIME_ZONE,
  DEFAULT_RANGE,
  FOREIGN_COMPANY_PARAMS,
  MAX_RANGE_DAYS,
  PRESET_DAYS,
  type DashboardRange,
  type PresetRange,
} from "./dashboard.constants";

const MONTH_LENGTH = 7;
const FIRST_DAY_SUFFIX = "-01";

/** What a pasted or shared link asked for that the dashboard cannot honour; shown once above the numbers. */
export type PeriodNotice = "company" | "dates" | "timeZone";

export type PeriodSelection = {
  range: DashboardRange;
  from?: string;
  to?: string;
  notice?: PeriodNotice;
};

export type CustomRangeError = "order" | "required" | "tooLong";

/** Why a custom range cannot be asked for; the same rules the API applies. */
export function customRangeError(from: string | null | undefined, to: string | null | undefined): CustomRangeError | null {
  if (!isCalendarDay(from) || !isCalendarDay(to)) return "required";
  if (to < from) return "order";
  return daysBetween(from, to) + 1 > MAX_RANGE_DAYS ? "tooLong" : null;
}

/** Today's calendar day in Ho Chi Minh City, whatever zone the browser is in. */
export function todayInVietnam(now: Date = new Date()): string {
  return ictDayKey(now);
}

/**
 * The days a preset covers on a given day. Presets end yesterday, because today is not over and its counts would be
 * partial; "this month" starts on the 1st and, on the 1st itself, is that day so far. The API applies the same rule.
 */
export function presetWindow(range: PresetRange, today: string): { from: string; to: string } {
  const yesterday = addDays(today, -1);
  if (range === "this_month") {
    const from = `${today.slice(0, MONTH_LENGTH)}${FIRST_DAY_SUFFIX}`;
    return { from, to: yesterday >= from ? yesterday : today };
  }
  const days = PRESET_DAYS[range] ?? PRESET_DAYS[DEFAULT_RANGE] ?? 1;
  return { from: addDays(yesterday, -(days - 1)), to: yesterday };
}

/** A period that starts after today: every count in it is zero, and the page says so plainly. */
export function isFuturePeriod(from: string, today: string): boolean {
  return from > today;
}

/**
 * Reads the period from the address. Anything the page cannot use falls back to the default period and is reported
 * as a notice instead of being applied or silently dropped.
 */
export function parsePeriodParams(params: URLSearchParams): PeriodSelection {
  const rawRange = params.get(DASHBOARD_PARAMS.range);
  const rawFrom = params.get(DASHBOARD_PARAMS.from);
  const rawTo = params.get(DASHBOARD_PARAMS.to);
  const zone = params.get(DASHBOARD_PARAMS.timeZone);

  let notice: PeriodNotice | undefined;
  if (zone !== null && zone !== DASHBOARD_TIME_ZONE) notice = "timeZone";

  const range = DASHBOARD_RANGES.find((candidate) => candidate === rawRange);
  if (rawRange !== null && !range) {
    return { notice: notice ?? "dates", range: DEFAULT_RANGE };
  }
  if (range === "custom") {
    if (customRangeError(rawFrom, rawTo) !== null || !rawFrom || !rawTo) {
      return { notice: notice ?? "dates", range: DEFAULT_RANGE };
    }
    return { ...(notice ? { notice } : {}), from: rawFrom, range, to: rawTo };
  }

  if (!notice && FOREIGN_COMPANY_PARAMS.some((key) => params.has(key))) notice = "company";
  return { ...(notice ? { notice } : {}), range: range ?? DEFAULT_RANGE };
}

/** The request for a selection; a preset is only the name, a custom range adds its two days. */
export function periodQuery(selection: PeriodSelection): NonNullable<GetApiV1DashboardCompanyData["query"]> {
  return selection.range === "custom" && selection.from && selection.to
    ? { from: selection.from, range: "custom", to: selection.to }
    : { range: selection.range };
}
