/** Wording of the statistics screens: numbers, calendar days, ranges and the moment the numbers are from. */

const VIETNAMESE = "vi";
const VIETNAMESE_LOCALE = "vi-VN";
const ENGLISH_LOCALE = "en-GB";
const TIME_ZONE_ICT = "Asia/Ho_Chi_Minh";
const PERCENT = 100;
// `YYYY-MM-DD`: the year is the first four characters and the month the first seven.
const YEAR_LENGTH = 4;
const MONTH_LENGTH = 7;

/** The locale Intl should use for an i18next language code. */
export function intlLocale(language: string): string {
  return language.startsWith(VIETNAMESE) ? VIETNAMESE_LOCALE : ENGLISH_LOCALE;
}

/** A whole number with the thousands separator of the language: 2,116 in English, 2.116 in Vietnamese. */
export function formatCount(value: number, language: string): string {
  return new Intl.NumberFormat(intlLocale(language)).format(value);
}

/** A decimal with at most one digit, e.g. the average applications a day. */
export function formatDecimal(value: number, language: string): string {
  return new Intl.NumberFormat(intlLocale(language), { maximumFractionDigits: 1 }).format(value);
}

/** Share of a total as a whole percentage; 0 when there is no total. */
export function percentOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * PERCENT) : 0;
}

// A calendar day has no time zone: it is read as UTC midnight and printed in UTC so no viewer's zone shifts it.
function dayDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function dayParts(day: string, language: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale(language), { ...options, timeZone: "UTC" }).format(dayDate(day));
}

/** "11 Sep" */
export function formatShortDay(day: string, language: string): string {
  return dayParts(day, language, { day: "numeric", month: "short" });
}

/** "11 Sep 2026" */
export function formatFullDay(day: string, language: string): string {
  return dayParts(day, language, { day: "numeric", month: "short", year: "numeric" });
}

/** "Fri" */
export function formatWeekdayShort(day: string, language: string): string {
  return dayParts(day, language, { weekday: "short" });
}

/** The first letter of a weekday, for the narrow labels of a calendar grid ("M", "T", …). */
export function formatWeekdayInitial(day: string, language: string): string {
  return dayParts(day, language, { weekday: "narrow" });
}

function year(day: string): string {
  return day.slice(0, YEAR_LENGTH);
}

function month(day: string): string {
  return day.slice(0, MONTH_LENGTH);
}

/**
 * A range of days: "4–10 Oct" within one month, "11 Sep – 10 Oct" across months, with the year after it when asked
 * and on both ends when the range crosses a year. `spaced` puts spaces around the dash ("11 Sep – 10 Oct", for a
 * heading) instead of tight ("11–17 Sep", for a chart label).
 */
export function formatDayRange(from: string, to: string, language: string, options: { spaced?: boolean; withYear?: boolean } = {}): string {
  const { spaced = true, withYear = false } = options;
  const dash = spaced ? " – " : "–";
  if (from === to) return withYear ? formatFullDay(from, language) : formatShortDay(from, language);
  if (year(from) !== year(to)) return `${formatFullDay(from, language)}${dash}${formatFullDay(to, language)}`;
  const tail = withYear ? ` ${year(to)}` : "";
  if (month(from) === month(to)) {
    return `${dayParts(from, language, { day: "numeric" })}${dash}${formatShortDay(to, language)}${tail}`;
  }
  return `${formatShortDay(from, language)}${dash}${formatShortDay(to, language)}${tail}`;
}

/** The date and the time of an instant in Ho Chi Minh City, for "Data as of …". */
export function formatAsOf(instant: string, language: string): { date: string; time: string } {
  const moment = new Date(instant);
  if (Number.isNaN(moment.getTime())) return { date: "—", time: "—" };
  const locale = intlLocale(language);
  return {
    date: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: TIME_ZONE_ICT, year: "numeric" }).format(moment),
    time: new Intl.DateTimeFormat(locale, { hour: "2-digit", hour12: false, minute: "2-digit", timeZone: TIME_ZONE_ICT }).format(moment),
  };
}
