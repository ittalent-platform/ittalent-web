const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Formats date and time as "28 Sept 2026, 08:55"
 */
export function formatEnterpriseDateTime(value?: string | Date | null, fallback = "—"): string {
  if (!value) return fallback;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return fallback;

  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Groups Vietnamese tax codes as "0312 345 678" or "0312 345 678-001"
 */
export function formatTaxCode(code?: string | null, fallback = "—"): string {
  if (!code) return fallback;
  const raw = code.trim().replace(/\s+/g, "");
  if (!raw) return fallback;

  // 10-digit tax code: xxxx xxx xxx
  if (/^\d{10}$/.test(raw)) {
    return `${raw.slice(0, 4)} ${raw.slice(4, 7)} ${raw.slice(7, 10)}`;
  }

  // 13-digit tax code (optional dash before last 3 digits)
  const match13 = raw.match(/^(\d{10})-?(\d{3})$/);
  if (match13 && match13[1] && match13[2]) {
    const main = match13[1];
    const branch = match13[2];
    return `${main.slice(0, 4)} ${main.slice(4, 7)} ${main.slice(7, 10)}-${branch}`;
  }

  return code;
}
