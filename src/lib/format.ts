const EN_GB_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Fixed en-GB "d Mon yyyy" format, independent of the viewer's browser locale. */
export function formatDate(value?: string, options?: { emptyFallback?: string }): string {
  const fallback = options?.emptyFallback ?? "—";
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return EN_GB_DATE_FORMATTER.format(date);
}

/** "dd Mon yyyy" format using the viewer's browser locale. */
export function formatDateLocale(value?: string, options?: { emptyFallback?: string }): string {
  const fallback = options?.emptyFallback ?? "";
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function getInitials(text?: string): string {
  return (text ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const ICT = "Asia/Ho_Chi_Minh";
const DAY_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", timeZone: ICT, year: "numeric" });
const TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, minute: "2-digit", timeZone: ICT });
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", { day: "numeric", hour: "2-digit", hour12: false, minute: "2-digit", month: "short", timeZone: ICT, year: "numeric" });
const DAY_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: ICT, year: "numeric" });
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-GB", { timeZone: ICT, weekday: "long" });
export const MS_PER_DAY = 86_400_000;

const validDate = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

/** "HH:mm" in Vietnam time (ICT); the caller labels the zone. */
export function formatTimeIct(value?: string): string {
  const date = validDate(value);
  return date ? TIME_FORMATTER.format(date) : "—";
}

/** "d Mon yyyy, HH:mm" in Vietnam time (ICT). */
export function formatDateTimeIct(value?: string): string {
  const date = validDate(value);
  return date ? DATE_TIME_FORMATTER.format(date) : "—";
}

/** Calendar day (`YYYY-MM-DD`) of an instant in Vietnam time, for grouping feeds by day. */
export function ictDayKey(value: string | Date): string {
  const date = typeof value === "string" ? validDate(value) : value;
  return date ? DAY_KEY_FORMATTER.format(date) : "";
}

/** Heading parts of a feed day in Vietnam time: "today" / "yesterday" / weekday name, plus "8 Oct 2026". */
export function ictDayHeading(value: string, now = new Date()): { date: string; kind: "today" | "yesterday" | "weekday"; weekday: string } {
  const date = validDate(value);
  const key = ictDayKey(value);
  const kind = key === ictDayKey(now) ? "today" : key === ictDayKey(new Date(now.getTime() - MS_PER_DAY)) ? "yesterday" : "weekday";
  return { date: date ? DAY_DATE_FORMATTER.format(date) : "—", kind, weekday: date ? WEEKDAY_FORMATTER.format(date) : "—" };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12 Mar 2025" from a date-only "2025-03-12", with no time-zone shift. */
export function formatCalendarDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
