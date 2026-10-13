import { DAYS_PER_WEEK, EPOCH_DAY_OF_WEEK, MS_PER_DAY, SUNDAY, type InterviewItem } from "./interviews.constants";
import { startOfVietnamDay, vietnamDay } from "./interviews.format";

const MONTH_PATTERN = /^20\d{2}-(0[1-9]|1[0-2])$/;
const MONTH_LENGTH = "YYYY-MM".length;
const SAMPLE_SUNDAY = "2024-01-07";

export type CalendarDay = { dayOfMonth: number; day: string; inMonth: boolean };
export type MonthGrid = { days: CalendarDay[]; from: string; to: string };

/** `YYYY-MM` of the Vietnam-time month a moment falls in. */
export function monthOf(value: string | number | Date): string {
  return vietnamDay(value).slice(0, MONTH_LENGTH);
}

/** A `YYYY-MM` from the address, or `fallback` when it is missing or not a month. */
export function parseMonth(value: string | null, fallback: string): string {
  return value && MONTH_PATTERN.test(value) ? value : fallback;
}

/** The month `delta` months from `month`; the year rolls over. */
export function shiftMonth(month: string, delta: number): string {
  const [year, number] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, MONTH_LENGTH);
}

const dayNumber = (day: string): number => Math.floor(Date.parse(`${day}T00:00:00.000Z`) / MS_PER_DAY);
const dayOfNumber = (number: number): string => new Date(number * MS_PER_DAY).toISOString().slice(0, "YYYY-MM-DD".length);
/** Position in the week, Sunday = 0. */
const weekdayOfNumber = (number: number): number => (number + EPOCH_DAY_OF_WEEK) % DAYS_PER_WEEK;

/**
 * The weeks a month is drawn over, Sunday to Saturday, including the days of the neighbouring months that
 * fill the first and last week. `from` / `to` are the instants (Vietnam time) the interviews are asked for.
 */
export function monthGrid(month: string): MonthGrid {
  const first = dayNumber(`${month}-01`);
  const last = dayNumber(`${shiftMonth(month, 1)}-01`) - 1;
  const start = first - (weekdayOfNumber(first) - SUNDAY);
  const end = last + (DAYS_PER_WEEK - 1 - weekdayOfNumber(last));

  const days: CalendarDay[] = [];
  for (let number = start; number <= end; number += 1) {
    const day = dayOfNumber(number);
    days.push({ day, dayOfMonth: Number(day.slice(-2)), inMonth: day.startsWith(month) });
  }
  const firstDay = days[0]!.day;
  const lastDay = days[days.length - 1]!.day;
  return {
    days,
    from: new Date(startOfVietnamDay(firstDay)).toISOString(),
    to: new Date(startOfVietnamDay(lastDay) + MS_PER_DAY - 1).toISOString(),
  };
}

/** The interviews of each Vietnam-time day, earliest first. */
export function groupByDay(items: InterviewItem[]): Map<string, InterviewItem[]> {
  const days = new Map<string, InterviewItem[]>();
  for (const item of [...items].sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))) {
    const day = vietnamDay(item.scheduledAt);
    days.set(day, [...(days.get(day) ?? []), item]);
  }
  return days;
}

function upperFirst(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

function format(day: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(new Date(`${day}T00:00:00.000Z`));
}

/** "October 2026". */
export function monthTitle(month: string, language: string): string {
  return upperFirst(format(`${month}-01`, language === "vi" ? "vi-VN" : "en-GB", { month: "long", year: "numeric" }));
}

/** "October". */
export function monthName(month: string, language: string): string {
  return format(`${month}-01`, language === "vi" ? "vi-VN" : "en-GB", { month: "long" });
}

/** "Thursday, October 15". */
export function longDayTitle(day: string, language: string): string {
  return upperFirst(format(day, language === "vi" ? "vi-VN" : "en-US", { day: "numeric", month: "long", weekday: "long" }));
}

/** The short weekday names, Sunday first. */
export function weekdayNames(language: string): string[] {
  const first = dayNumber(SAMPLE_SUNDAY);
  return Array.from({ length: DAYS_PER_WEEK }, (_, offset) =>
    format(dayOfNumber(first + offset), language === "vi" ? "vi-VN" : "en-GB", { weekday: "short" }),
  );
}
