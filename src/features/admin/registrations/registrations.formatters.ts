export function formatSubmittedDate(dateStr?: string | null): { date: string; time: string } {
  if (!dateStr) return { date: "—", time: "" };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: "" };

    const date = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { date, time };
  } catch {
    return { date: dateStr, time: "" };
  }
}

export function calculateWaitingDays(dateStr?: string | null): { text: string; isUrgent: boolean } {
  if (!dateStr) return { text: "—", isUrgent: false };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { text: "—", isUrgent: false };

    const diffMs = Date.now() - d.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 1) {
      return { text: "< 1 day", isUrgent: false };
    }
    const text = `${days} ${days === 1 ? "day" : "days"}`;
    return { text, isUrgent: days >= 5 };
  } catch {
    return { text: "—", isUrgent: false };
  }
}

export function getInitials(name?: string | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
