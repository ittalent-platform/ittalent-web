import { DEADLINE_OFFSET_HOURS, MS_PER_HOUR } from "./job-postings.constants";

const DATE_LENGTH = "YYYY-MM-DD".length;

/** `YYYY-MM-DD` in Asia/Ho_Chi_Minh for an instant, e.g. to pre-fill the deadline field or set its minimum. */
export function toDeadlineDate(value: string | number | Date): string {
  return new Date(
    new Date(value).getTime() + DEADLINE_OFFSET_HOURS * MS_PER_HOUR,
  )
    .toISOString()
    .slice(0, DATE_LENGTH);
}

export function formatDeadline(value?: string): string {
  if (!value) return "—";
  const [year, month, day] = toDeadlineDate(value).split("-");
  return `${day}/${month}/${year}`;
}

const MILLION = 1_000_000;

/**
 * "2,000 – 3,500 VND", "From 2,000 VND", "Negotiable" or "—" when no salary was entered.
 * `compact` prints VND in millions ("45–60M VND") for list rows.
 */
export function formatSalary(
  posting: {
    salaryMin?: number;
    salaryMax?: number;
    currency: string;
    salaryNegotiable: boolean;
  },
  options: { compact?: boolean } = {},
): string {
  const { salaryMin, salaryMax, currency, salaryNegotiable } = posting;
  if (salaryNegotiable) return "Negotiable";
  const compact =
    options.compact &&
    currency === "VND" &&
    [salaryMin, salaryMax].every(
      (value) => value === undefined || value >= MILLION,
    );
  const amount = (value: number) =>
    compact
      ? `${Number((value / MILLION).toFixed(1))}M`
      : value.toLocaleString("en-US");
  const separator = compact ? "–" : " – ";
  if (salaryMin !== undefined && salaryMax !== undefined)
    return `${amount(salaryMin)}${separator}${amount(salaryMax)} ${currency}`;
  if (salaryMin !== undefined) return `From ${amount(salaryMin)} ${currency}`;
  if (salaryMax !== undefined) return `Up to ${amount(salaryMax)} ${currency}`;
  return "—";
}

/** Prefixed mono id shown in lists and breadcrumbs, e.g. JOB-4C6A. */
export function jobDisplayId(id: string): string {
  return `JOB-${id.slice(-4).toUpperCase()}`;
}

/** "01 Oct 2026" for a created / updated timestamp. */
export function formatPostedDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
