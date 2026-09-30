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

/** "3 days ago", "1 week ago" — the wording used on the public marketplace cards. */
export function postedAgo(dateStr?: string) {
  if (!dateStr) return null;
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return null;
  const days = Math.floor((Date.now() - time) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/** Postings from the last few days get the "New" badge. */
export function isNewPosting(dateStr?: string) {
  if (!dateStr) return false;
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time < 5 * 86_400_000;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "25 Oct 2026" */
export function formatDeadline(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Lumen Labs" -> "LL" */
export function companyInitials(name?: string) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const LOGO_PALETTES = [
  { bg: "#fde8e0", fg: "#b33305" },
  { bg: "#e8f5ee", fg: "#12764a" },
  { bg: "#e4ecfb", fg: "#2a55a8" },
  { bg: "#f1efea", fg: "#4a4a50" },
  { bg: "#efe9fb", fg: "#6941c6" },
];

/** Stable colour pair per company, taken from the marketplace palette. */
export function logoPalette(seed?: string) {
  let hash = 0;
  for (const char of seed ?? "") hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return LOGO_PALETTES[hash % LOGO_PALETTES.length];
}

/** Salary as printed on the marketplace cards: "25–35M VND / mo", "Negotiable". */
export function formatSalaryCard(min?: number, max?: number, currency?: string) {
  min = min && min > 0 ? min : undefined;
  max = max && max > 0 ? max : undefined;
  if (!min && !max) return "Negotiable";

  const isVnd = !currency || currency === "VND";
  const short = (value: number) =>
    isVnd
      ? String(Number((value / 1_000_000).toFixed(1)))
      : value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const suffix = isVnd ? "M VND / mo" : ` ${currency} / mo`;

  if (min && max) {
    return min === max
      ? `${short(min)}${suffix}`
      : `${short(min)}–${short(max)}${suffix}`;
  }
  return min ? `From ${short(min)}${suffix}` : `Up to ${short(max!)}${suffix}`;
}