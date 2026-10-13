import type { TFunction } from "i18next";

import {
  DAYS_PER_WEEK,
  EPOCH_DAY_OF_WEEK,
  INTERVIEW_TIME_ZONE,
  INTERVIEW_UTC_OFFSET_HOURS,
  MINUTES_PER_HOUR,
  MONDAY,
  MS_PER_DAY,
  MS_PER_HOUR,
  type InterviewDateFilter,
} from "./interviews.constants";

const DATE_LENGTH = "YYYY-MM-DD".length;
/** Where `HH:mm` ends in an ISO string: `YYYY-MM-DDTHH:mm`. */
const CLOCK_END = "YYYY-MM-DDTHH:mm".length;

function localeOf(language: string): string {
  return language === "vi" ? "vi-VN" : "en-GB";
}

function partsOf(iso: string, language: string, options: Intl.DateTimeFormatOptions): Record<string, string> {
  const formatter = new Intl.DateTimeFormat(localeOf(language), { ...options, hourCycle: "h23", timeZone: INTERVIEW_TIME_ZONE });
  return Object.fromEntries(formatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
}

/** The applicant's name, or the email when the account has no name. */
export function applicantName(applicant: { email: string | null; fullName: string | null }): string {
  return applicant.fullName?.trim() || applicant.email || "—";
}

/** First and last word of a name, so "Trịnh Văn Long" gets the initials "TL". */
export function initialsName(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length > 2 ? `${words[0]} ${words[words.length - 1]}` : name;
}

/** "Wed, 30 Sept": the weekday and day of an instant in Vietnam time. */
export function formatShortDay(iso: string, language: string): string {
  const parts = partsOf(iso, language, { day: "numeric", month: "short", weekday: "short" });
  return `${parts.weekday}, ${parts.day} ${parts.month}`;
}

/** "Thu, 15 Oct 2026". */
export function formatFullDay(iso: string, language: string): string {
  const parts = partsOf(iso, language, { day: "numeric", month: "short", weekday: "short", year: "numeric" });
  return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`;
}

/** "10:00" in Vietnam time. */
export function formatTime(iso: string, language: string): string {
  const parts = partsOf(iso, language, { hour: "2-digit", minute: "2-digit" });
  return `${parts.hour}:${parts.minute}`;
}

/** "7 Oct 2026, 10:02": an instant of the history, in Vietnam time. */
export function formatDateTime(iso: string, language: string): string {
  const parts = partsOf(iso, language, { day: "numeric", hour: "2-digit", minute: "2-digit", month: "short", year: "numeric" });
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute}`;
}

/** "10:00 – 11:00". */
export function formatTimeRange(startIso: string, endIso: string, language: string): string {
  return `${formatTime(startIso, language)} – ${formatTime(endIso, language)}`;
}

/** "45 minutes", "1 hour" or "1 h 30 min". */
export function formatDuration(minutes: number, t: TFunction): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  if (hours === 0) return t("interviews.duration.minutes", { count: rest });
  if (rest === 0) return t("interviews.duration.hours", { count: hours });
  return t("interviews.duration.hoursMinutes", { hours, minutes: rest });
}

/** "1h", "45m" or "1h 30m": the compact length used where space is tight. */
export function formatDurationShort(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  return [hours > 0 ? `${hours}h` : "", rest > 0 ? `${rest}m` : ""].filter(Boolean).join(" ");
}

/** `YYYY-MM-DD` of an instant in Vietnam time. */
export function vietnamDay(value: string | number | Date): string {
  return new Date(new Date(value).getTime() + INTERVIEW_UTC_OFFSET_HOURS * MS_PER_HOUR).toISOString().slice(0, DATE_LENGTH);
}

/** The clock time (`HH:mm`, 24-hour) of an instant in Vietnam time, as a time input holds it. */
export function vietnamClock(value: string | number | Date): string {
  return new Date(new Date(value).getTime() + INTERVIEW_UTC_OFFSET_HOURS * MS_PER_HOUR).toISOString().slice(DATE_LENGTH + 1, CLOCK_END);
}

/** The UTC instant at which `YYYY-MM-DD` starts in Vietnam time. */
export function startOfVietnamDay(day: string): number {
  return Date.parse(`${day}T00:00:00.000Z`) - INTERVIEW_UTC_OFFSET_HOURS * MS_PER_HOUR;
}

/** Position of a Vietnam-time day in the week, Monday = 0. */
function mondayIndex(day: string): number {
  const dayNumber = Math.floor(Date.parse(`${day}T00:00:00.000Z`) / MS_PER_DAY);
  return (dayNumber + EPOCH_DAY_OF_WEEK - MONDAY + DAYS_PER_WEEK) % DAYS_PER_WEEK;
}

export type DateWindow = { from?: string; to?: string };

/**
 * The `from` / `to` the API takes for a date preset. Windows follow the calendar days of Vietnam,
 * so "today" is the same set of interviews for everyone using the same company.
 */
export function dateWindow(filter: InterviewDateFilter, now: Date): DateWindow {
  const today = vietnamDay(now);
  const dayStart = startOfVietnamDay(today);
  const window = (fromMs: number, daysLong: number): DateWindow => ({
    from: new Date(fromMs).toISOString(),
    to: new Date(fromMs + daysLong * MS_PER_DAY - 1).toISOString(),
  });

  switch (filter) {
    case "today":
      return window(dayStart, 1);
    case "thisWeek":
      return window(dayStart - mondayIndex(today) * MS_PER_DAY, DAYS_PER_WEEK);
    case "thisMonth": {
      const [year, month] = today.split("-").map(Number) as [number, number];
      const offset = INTERVIEW_UTC_OFFSET_HOURS * MS_PER_HOUR;
      const first = Date.UTC(year, month - 1, 1) - offset;
      // Date.UTC rolls month 12 over into January of the next year.
      return window(first, (Date.UTC(year, month, 1) - offset - first) / MS_PER_DAY);
    }
    case "upcoming":
      return { from: now.toISOString() };
    case "past":
      return { to: now.toISOString() };
  }
}

/** The instant (ISO, with the +07:00 offset) a Vietnam-time `YYYY-MM-DD` date and `HH:mm` time stand for. */
export function toScheduledAt(day: string, time: string): string {
  const offset = `+${String(INTERVIEW_UTC_OFFSET_HOURS).padStart(2, "0")}:00`;
  return new Date(`${day}T${time}:00${offset}`).toISOString();
}
