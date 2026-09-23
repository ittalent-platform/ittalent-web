const EN_GB_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** Fixed en-GB "dd Mon yyyy" format, independent of the viewer's browser locale. */
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
