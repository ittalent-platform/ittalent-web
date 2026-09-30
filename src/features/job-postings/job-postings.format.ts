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
