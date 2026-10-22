import { formatTimeIct, ictDayKey, MS_PER_DAY } from "@/lib/format";

/**
 * Formats a notification timestamp to match the exact design specifications:
 * - < 1 min: "Just now" / "Vừa xong"
 * - < 60 min: "12 min ago" / "12 phút trước"
 * - < 24 hours (same day): "2 h ago" / "2 giờ trước"
 * - Yesterday: "Yesterday, 16:40" / "Hôm qua, 16:40"
 * - Older in current year: "20 Sept" / "20 Th09"
 * - Previous years: "20 Sept 2025"
 */
export function formatNotificationRelativeTime(
  value: string | Date | undefined,
  locale = "en",
  now = new Date(),
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);
  const isVi = locale.startsWith("vi");

  if (diffMinutes < 1) {
    return isVi ? "Vừa xong" : "Just now";
  }

  if (diffMinutes < 60) {
    return isVi ? `${diffMinutes} phút trước` : `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMs / 3_600_000);
  const nowDayKey = ictDayKey(now);
  const dateDayKey = ictDayKey(date);

  if (nowDayKey === dateDayKey && diffHours < 24) {
    return isVi ? `${diffHours} giờ trước` : `${diffHours} h ago`;
  }

  const yesterdayDate = new Date(now.getTime() - MS_PER_DAY);
  if (dateDayKey === ictDayKey(yesterdayDate)) {
    const timeStr = formatTimeIct(date.toISOString());
    return isVi ? `Hôm qua, ${timeStr}` : `Yesterday, ${timeStr}`;
  }

  const day = date.getDate();
  const monthFormatter = new Intl.DateTimeFormat(isVi ? "vi-VN" : "en-GB", {
    month: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const month = monthFormatter.format(date);

  if (date.getFullYear() === now.getFullYear()) {
    return `${day} ${month}`;
  }

  return `${day} ${month} ${date.getFullYear()}`;
}
