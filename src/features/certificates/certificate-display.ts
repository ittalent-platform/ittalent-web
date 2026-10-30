import type { CertificateLink } from "@/api/generated/types.gen";

/** Today as "YYYY-MM-DD" in the viewer's own calendar. */
export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isExpired(certificate: Pick<CertificateLink, "expiryDate">, today = todayIso()): boolean {
  return Boolean(certificate.expiryDate && certificate.expiryDate < today);
}
