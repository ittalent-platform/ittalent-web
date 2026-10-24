import { Plus, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListToolbar } from "@/components/common/list-toolbar";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FilterSelect } from "@/components/ui/filter-select";

import {
  BROADCAST_AUDIENCES,
  BROADCAST_PRIORITIES,
  BROADCAST_STATUSES,
} from "./broadcast-notifications.constants";

type BroadcastNotificationsToolbarProps = {
  audience: string;
  fromDate?: string;
  onAudienceChange: (audience: string) => void;
  onCreateClick: () => void;
  onFromDateChange: (date: string) => void;
  onPriorityChange: (priority: string) => void;
  onResetFilters: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: string) => void;
  onToDateChange: (date: string) => void;
  priority: string;
  search: string;
  status: string;
  toDate?: string;
};

export function BroadcastNotificationsToolbar({
  audience,
  fromDate = "",
  onAudienceChange,
  onCreateClick,
  onFromDateChange,
  onPriorityChange,
  onResetFilters,
  onSearchChange,
  onStatusChange,
  onToDateChange,
  priority,
  search,
  status,
  toDate = "",
}: BroadcastNotificationsToolbarProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    audience !== "all" ||
    priority !== "all" ||
    Boolean(fromDate) ||
    Boolean(toDate);

  const statusOptions = [
    { label: t("adminBroadcasts.toolbar.statusAll"), value: "all" },
    ...BROADCAST_STATUSES.map((s) => ({
      label: t(`adminBroadcasts.status.${s}`, { defaultValue: s }),
      value: s,
    })),
  ];

  const audienceOptions = [
    { label: t("adminBroadcasts.toolbar.audienceAll"), value: "all" },
    ...BROADCAST_AUDIENCES.map((a) => ({
      label: t(`adminBroadcasts.audience.${a}`, { defaultValue: a }),
      value: a,
    })),
  ];

  const priorityOptions = [
    { label: t("adminBroadcasts.toolbar.priorityAll"), value: "all" },
    ...BROADCAST_PRIORITIES.map((p) => ({
      label: t(`adminBroadcasts.priority.${p}`, { defaultValue: p }),
      value: p,
    })),
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <ListToolbar
          onSearchChange={onSearchChange}
          search={search}
          searchPlaceholder={t("adminBroadcasts.toolbar.searchPlaceholder")}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterSelect
              onChange={onStatusChange}
              options={statusOptions}
              value={status}
            />

            <FilterSelect
              onChange={onAudienceChange}
              options={audienceOptions}
              value={audience}
            />

            <FilterSelect
              onChange={onPriorityChange}
              options={priorityOptions}
              value={priority}
            />

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <DatePicker
                  aria-invalid={Boolean(fromDate && toDate && fromDate > toDate)}
                  clearable
                  max={toDate || undefined}
                  onChange={onFromDateChange}
                  placeholder={t("adminBroadcasts.toolbar.fromDatePlaceholder")}
                  value={fromDate}
                />
                <span className="text-xs text-muted-foreground">—</span>
                <DatePicker
                  aria-invalid={Boolean(fromDate && toDate && fromDate > toDate)}
                  clearable
                  min={fromDate || undefined}
                  onChange={onToDateChange}
                  placeholder={t("adminBroadcasts.toolbar.toDatePlaceholder")}
                  value={toDate}
                />
              </div>
              {fromDate && toDate && fromDate > toDate ? (
                <span className="text-xs font-medium text-destructive">
                  {t("adminBroadcasts.toolbar.invalidDateRange")}
                </span>
              ) : null}
            </div>

            {hasActiveFilters ? (
              <Button
                className="h-9 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
                onClick={onResetFilters}
                size="sm"
                variant="ghost"
              >
                <RotateCcw className="size-3.5" />
                {t("adminBroadcasts.toolbar.resetFilters")}
              </Button>
            ) : null}
          </div>
        </ListToolbar>
      </div>

      <div className="shrink-0">
        <Button
          className="gap-1.5 font-medium shadow-xs"
          onClick={onCreateClick}
          type="button"
        >
          <Plus className="size-4" />
          {t("adminBroadcasts.actions.create")}
        </Button>
      </div>
    </div>
  );
}
