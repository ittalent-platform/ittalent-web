export const EMPLOYMENT_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  intern: "Internship",
  contractor: "Contract",
  probationary: "Probationary",
  remote: "Remote",
};

export const LEVEL_LABELS: Record<string, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  lead: "Lead",
};

export function formatSalaryRange(
  min?: number,
  max?: number,
  currency?: string,
) {
  const c =
    currency === "USD" || !currency || currency === "VND"
      ? "$"
      : `${currency} `;
  if (!min && !max) return "Negotiable";
  if (min && max) return `${c}${min.toLocaleString()}–${max.toLocaleString()}`;
  if (min) return `${c}${min.toLocaleString()}+`;
  return `Up to ${c}${max!.toLocaleString()}`;
}

export function formatSalary(min?: number, max?: number, currency?: string) {
  min = min && min > 0 ? min : undefined;
  max = max && max > 0 ? max : undefined;
  const isVnd = !currency || currency === "VND";
  const c = isVnd ? "" : currency === "USD" ? "$" : `${currency} `;
  const amount = (value: number) =>
    isVnd
      ? `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
      : value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (!min && !max) return "Negotiable";
  if (min && max) return `${c}${amount(min)} – ${amount(max)}`;
  if (min) return `${c}From ${amount(min)}`;
  return `${c}Up to ${amount(max!)}`;
}

export function formatDateDMY(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

/** Was defined twice in the original career-page.tsx (as timeAgo and
 * timeAgoDetail) with byte-identical bodies — consolidated to one export. */
export function timeAgo(dateStr?: string) {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
