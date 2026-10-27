import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type BroadcastFilterChipsProps = {
  audience: string;
  fromDate?: string;
  onClearAll: () => void;
  onClearAudience: () => void;
  onClearDateRange: () => void;
  onClearPriority: () => void;
  onClearSearch: () => void;
  onClearStatus: () => void;
  priority: string;
  search: string;
  status: string;
  toDate?: string;
};

export function BroadcastFilterChips({
  audience,
  fromDate = "",
  onClearAll,
  onClearAudience,
  onClearDateRange,
  onClearPriority,
  onClearSearch,
  onClearStatus,
  priority,
  search,
  status,
  toDate = "",
}: BroadcastFilterChipsProps) {
  const { t } = useTranslation();

  const chips: { key: string; label: string; onRemove: () => void; value: string }[] = [];

  if (search.trim()) {
    chips.push({
      key: "search",
      label: t("adminBroadcasts.filterChips.search"),
      onRemove: onClearSearch,
      value: `"${search.trim()}"`,
    });
  }

  if (status !== "all") {
    chips.push({
      key: "status",
      label: t("adminBroadcasts.filterChips.status"),
      onRemove: onClearStatus,
      value: t(`adminBroadcasts.status.${status}`, { defaultValue: status }),
    });
  }

  if (audience !== "all") {
    chips.push({
      key: "audience",
      label: t("adminBroadcasts.filterChips.audience"),
      onRemove: onClearAudience,
      value: t(`adminBroadcasts.audience.${audience}`, { defaultValue: audience }),
    });
  }

  if (priority !== "all") {
    chips.push({
      key: "priority",
      label: t("adminBroadcasts.filterChips.priority"),
      onRemove: onClearPriority,
      value: t(`adminBroadcasts.priority.${priority}`, { defaultValue: priority }),
    });
  }

  if (fromDate || toDate) {
    const dateText =
      fromDate && toDate
        ? `${fromDate} — ${toDate}`
        : fromDate
          ? `>= ${fromDate}`
          : `<= ${toDate}`;
    chips.push({
      key: "date",
      label: t("adminBroadcasts.filterChips.date"),
      onRemove: onClearDateRange,
      value: dateText,
    });
  }

  if (chips.length === 0) return null;

  return (
    <ul
      aria-label={t("adminBroadcasts.filterChips.activeFilters")}
      className="flex flex-wrap items-center gap-2 pt-1"
    >
      <li className="mr-1 text-[13px] text-muted-foreground">
        {t("adminBroadcasts.filterChips.activeFilters")}:
      </li>
      {chips.map((chip) => (
        <li
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card pl-3 pr-1 text-[13px]"
          key={chip.key}
        >
          <span className="font-medium text-foreground">
            {chip.label}: {chip.value}
          </span>
          <button
            aria-label={t("adminBroadcasts.filterChips.removeFilter", { filter: chip.label })}
            className="grid size-6 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted"
            onClick={chip.onRemove}
            type="button"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        </li>
      ))}
      <li>
        <Button onClick={onClearAll} size="sm" type="button" variant="link">
          {t("adminBroadcasts.filterChips.clearAll")}
        </Button>
      </li>
    </ul>
  );
}
