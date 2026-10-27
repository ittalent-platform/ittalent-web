/**
 * Calendar days written `YYYY-MM-DD`, with no time zone attached. Every day has 24 hours here, so plain arithmetic
 * on the UTC midnight of a day is exact; the dashboard uses it for dates that are already Ho Chi Minh City days.
 */
import { MS_PER_DAY } from "./format";

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAYS_PER_WEEK = 7;
const MONDAY_FIRST_OFFSET = DAYS_PER_WEEK - 1;
const ISO_DAY_LENGTH = 10;

/** True for a day that exists in the calendar (`2026-02-30` is refused). */
export function isCalendarDay(value: string | null | undefined): value is string {
  if (!value) return false;
  const match = ISO_DAY.exec(value);
  if (!match) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, ISO_DAY_LENGTH) === value;
}

export function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * MS_PER_DAY).toISOString().slice(0, ISO_DAY_LENGTH);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

/** 0 for Monday … 6 for Sunday: the week of a Vietnamese calendar starts on Monday. */
export function weekdayIndex(day: string): number {
  return (new Date(`${day}T00:00:00Z`).getUTCDay() + MONDAY_FIRST_OFFSET) % DAYS_PER_WEEK;
}

/** The Monday of the week a day belongs to. */
export function mondayOf(day: string): string {
  return addDays(day, -weekdayIndex(day));
}
