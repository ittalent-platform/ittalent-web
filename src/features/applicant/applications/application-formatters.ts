import type { ApplicationItem } from "./applications.constants";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
const TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
const RECORD_ID_PREFIX = "APP";
const RECORD_ID_LENGTH = 4;

const VIETNAMESE_LOCALE = "vi-VN";
const ENGLISH_LOCALE = "en-US";

function isVietnamese(locale: string): boolean {
  return locale.startsWith("vi");
}

/** Day-first "10 Sep 2026" in English (en-GB spells September "Sept"), the locale default in Vietnamese. */
export function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (isVietnamese(locale)) return new Intl.DateTimeFormat(VIETNAMESE_LOCALE, DATE_FORMAT).format(date);
  const parts = new Intl.DateTimeFormat(ENGLISH_LOCALE, DATE_FORMAT).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("day")} ${part("month")} ${part("year")}`;
}

export function formatTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(isVietnamese(locale) ? VIETNAMESE_LOCALE : ENGLISH_LOCALE, TIME_FORMAT).format(new Date(iso));
}

export function formatDateTime(iso: string, locale: string): string {
  return `${formatDate(iso, locale)}, ${formatTime(iso, locale)}`;
}

/** Prefixed mono record id (`APP-1A2B`), the same way user and news ids are shown. */
export function applicationDisplayId(id: string): string {
  return `${RECORD_ID_PREFIX}-${id.slice(-RECORD_ID_LENGTH).toUpperCase()}`;
}

/** "Company · Location · Type", skipping parts the job snapshot does not have. */
export function jobFacts(job: ApplicationItem["job"], includeCompany = false): string {
  return [includeCompany ? job.companyName : null, job.location, job.jobType].filter(Boolean).join(" · ");
}
