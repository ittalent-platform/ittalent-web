import { DEADLINE_OFFSET_HOURS, MS_PER_HOUR } from "./job-postings.constants";

const DATE_LENGTH = "YYYY-MM-DD".length;

/** `YYYY-MM-DD` in Asia/Ho_Chi_Minh for an instant, e.g. to pre-fill the deadline field or set its minimum. */
export function toDeadlineDate(value: string | number | Date): string {
  return new Date(new Date(value).getTime() + DEADLINE_OFFSET_HOURS * MS_PER_HOUR).toISOString().slice(0, DATE_LENGTH);
}

export function formatDeadline(value?: string): string {
  if (!value) return "—";
  const [year, month, day] = toDeadlineDate(value).split("-");
  return `${day}/${month}/${year}`;
}

/** "2,000 – 3,500 VND", "From 2,000 VND", "Negotiable" or "—" when no salary was entered. */
export function formatSalary(posting: { salaryMin?: number; salaryMax?: number; currency: string; salaryNegotiable: boolean }): string {
  const { salaryMin, salaryMax, currency, salaryNegotiable } = posting;
  if (salaryNegotiable) return "Negotiable";
  const amount = (value: number) => value.toLocaleString("en-US");
  if (salaryMin !== undefined && salaryMax !== undefined) return `${amount(salaryMin)} – ${amount(salaryMax)} ${currency}`;
  if (salaryMin !== undefined) return `From ${amount(salaryMin)} ${currency}`;
  if (salaryMax !== undefined) return `Up to ${amount(salaryMax)} ${currency}`;
  return "—";
}
