import { HISTORY_MAX_RANGE_MONTHS } from "./user-history.constants";

export type HistoryRangeError = "order" | "span";

/** `from` / `to` are `YYYY-MM-DD`; either may be empty. The API rejects to < from and ranges over 12 months. */
export function validateHistoryRange(from: string, to: string): HistoryRangeError | null {
  if (!from || !to) return null;
  if (to < from) return "order";
  const limit = new Date(`${from}T00:00:00Z`);
  limit.setUTCMonth(limit.getUTCMonth() + HISTORY_MAX_RANGE_MONTHS);
  return new Date(`${to}T00:00:00Z`) > limit ? "span" : null;
}

export type HistoryChip = { after: string | null; before?: string | null; field: string };

const PREVIOUS_PREFIX = "previous";

/** Turns an event's `changes` into before/after chips: `previousRole` + `role` become one chip; masked values stay as the API sent them. */
export function historyChips(changes: Record<string, string | null> | null): HistoryChip[] {
  if (!changes) return [];
  const chips: HistoryChip[] = [];
  // Email events record `previousEmail` + `newEmail`: one before/after chip labelled "Email".
  const emailChange = "previousEmail" in changes && "newEmail" in changes;
  if (emailChange) chips.push({ after: changes.newEmail ?? null, before: changes.previousEmail ?? null, field: "email" });
  for (const [key, value] of Object.entries(changes)) {
    if (emailChange && (key === "previousEmail" || key === "newEmail")) continue;
    if (key.startsWith(PREVIOUS_PREFIX) && key.length > PREVIOUS_PREFIX.length) {
      const field = key.charAt(PREVIOUS_PREFIX.length).toLowerCase() + key.slice(PREVIOUS_PREFIX.length + 1);
      if (field in changes) continue;
    }
    const previous = `${PREVIOUS_PREFIX}${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    chips.push(previous in changes ? { after: value, before: changes[previous], field: key } : { after: value, field: key });
  }
  return chips;
}
