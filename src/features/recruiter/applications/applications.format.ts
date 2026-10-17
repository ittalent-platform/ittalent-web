const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const INTERVIEW_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
};

const VIETNAMESE_LOCALE = "vi-VN";
const ENGLISH_LOCALE = "en-US";

function getLocaleTag(locale: string): string {
  return locale.startsWith("vi") ? VIETNAMESE_LOCALE : ENGLISH_LOCALE;
}

/** Formats dates as "7 Oct 2026" */
export function formatDate(iso: string, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(getLocaleTag(locale), DATE_FORMAT).format(date);
}

/** Formats times as "10:00" */
export function formatTime(iso: string, locale: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(getLocaleTag(locale), TIME_FORMAT).format(date);
}

/** Formats interview datetime as "Tue 20 Oct · 10:00" */
export function formatInterviewSchedule(iso: string, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  const datePart = new Intl.DateTimeFormat(getLocaleTag(locale), INTERVIEW_DATE_FORMAT).format(date);
  const timePart = formatTime(iso, locale);
  return `${datePart} · ${timePart}`;
}

export function candidateDisplayName(applicant: { fullName: string | null; email: string }): string {
  return applicant.fullName?.trim() || applicant.email;
}
