import type { CertificateLink } from "@/api/generated/types.gen";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12 Mar 2025" from a date-only "2025-03-12", without any time-zone shift. */
export function formatCalendarDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** Today as "YYYY-MM-DD" in the viewer's own calendar. */
export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** The host people recognise ("credly.com"), never fetched. */
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Read from the address only (BR-S4-LINK-002): the page itself is never opened. */
export function isInsecureLink(url: string): boolean {
  return url.toLowerCase().startsWith("http://");
}

export function isExpired(certificate: Pick<CertificateLink, "expiryDate">, today = todayIso()): boolean {
  return Boolean(certificate.expiryDate && certificate.expiryDate < today);
}
