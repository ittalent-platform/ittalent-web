import {
  Calendar,
  Eye,
  MoreVertical,
  Pencil,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTimeIct } from "@/lib/format";

import { BROADCAST_SORT_FIELD_BY_COLUMN } from "./broadcast-notifications.constants";
import type { BroadcastNotificationDto } from "./broadcast-notifications.types";
import { BroadcastPriorityBadge } from "./broadcast-priority-badge";
import { BroadcastStatusBadge } from "./broadcast-status-badge";

type BroadcastNotificationsTableProps = {
  hasFilters: boolean;
  isLoading: boolean;
  items: BroadcastNotificationDto[];
  onCancelSchedule: (item: BroadcastNotificationDto) => void;
  onClearFilters: () => void;
  onDelete: (item: BroadcastNotificationDto) => void;
  onDispatchNow: (item: BroadcastNotificationDto) => void;
  onEdit: (item: BroadcastNotificationDto) => void;
  onSchedule: (item: BroadcastNotificationDto) => void;
  onSort?: (field: "createdAt" | "scheduled_at" | "title" | "status") => void;
  onViewDetails: (item: BroadcastNotificationDto) => void;
  sortBy?: "createdAt" | "scheduled_at" | "title" | "status";
  sortOrder?: "asc" | "desc";
};

export function BroadcastNotificationsTable({
  hasFilters,
  isLoading,
  items,
  onCancelSchedule,
  onClearFilters,
  onDelete,
  onDispatchNow,
  onEdit,
  onSchedule,
  onSort,
  onViewDetails,
  sortBy = "createdAt",
  sortOrder = "desc",
}: BroadcastNotificationsTableProps) {
  const { t } = useTranslation();

  const columns: DataTableColumn<BroadcastNotificationDto>[] = [
    {
      cell: (item) => (
        <div className="flex min-w-0 flex-col py-1">
          <span className="truncate font-semibold text-foreground" title={item.title}>
            {item.title}
          </span>
          <span className="truncate text-xs text-muted-foreground" title={item.content}>
            {item.content}
          </span>
        </div>
      ),
      className: "w-[30%] min-w-[200px]",
      header: t("adminBroadcasts.table.announcement"),
      key: "title",
      sortable: true,
    },
    {
      cell: (item) => (
        <span className="text-xs text-foreground">
          {t(`adminBroadcasts.audience.${item.targetAudience}`, {
            defaultValue: item.targetAudience,
          })}
        </span>
      ),
      className: "w-[14%] whitespace-nowrap",
      header: t("adminBroadcasts.table.targetAudience"),
      key: "targetAudience",
    },
    {
      cell: (item) => <BroadcastPriorityBadge priority={item.priority} />,
      className: "w-[10%] whitespace-nowrap",
      header: t("adminBroadcasts.table.priority"),
      key: "priority",
    },
    {
      cell: (item) => <BroadcastStatusBadge status={item.status} />,
      className: "w-[12%] whitespace-nowrap",
      header: t("adminBroadcasts.table.status"),
      key: "status",
      sortable: true,
    },
    {
      cell: (item) => {
        const dateToShow =
          item.status === "Sent"
            ? item.sentAt
            : item.status === "Scheduled"
              ? item.scheduledAt
              : item.createdAt;
        return (
          <span className="text-xs text-foreground">
            {formatDateTimeIct(dateToShow ?? undefined)}
          </span>
        );
      },
      className: "w-[16%] whitespace-nowrap",
      header: t("adminBroadcasts.table.scheduleSent"),
      key: "scheduledAt",
      sortable: true,
    },
    {
      cell: (item) => {
        if (item.status !== "Sent") {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-foreground">
              {item.deliveryMetrics.readCount} / {item.deliveryMetrics.deliveredCount}
            </span>
            <span className="text-[11px] text-muted-foreground">
              ({item.deliveryMetrics.readPercentage}% {t("adminBroadcasts.table.read")})
            </span>
          </div>
        );
      },
      className: "w-[12%] whitespace-nowrap",
      header: t("adminBroadcasts.table.engagement"),
      key: "engagement",
    },
    {
      cell: (item) => (
        <div
          className="flex justify-end"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={t("adminBroadcasts.table.actionsAria", { title: item.title })}
                className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                type="button"
              >
                <MoreVertical className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 py-1">
              <DropdownMenuItem
                className="gap-2.5 text-[13px]"
                onSelect={() => onViewDetails(item)}
              >
                <Eye className="size-4" />
                {t("adminBroadcasts.table.viewDetails")}
              </DropdownMenuItem>

              {item.status === "Draft" ? (
                <>
                  <DropdownMenuItem
                    className="gap-2.5 text-[13px]"
                    onSelect={() => onEdit(item)}
                  >
                    <Pencil className="size-4" />
                    {t("actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2.5 text-[13px]"
                    onSelect={() => onSchedule(item)}
                  >
                    <Calendar className="size-4" />
                    {t("adminBroadcasts.actions.schedule")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2.5 text-[13px]"
                    onSelect={() => onDispatchNow(item)}
                  >
                    <Send className="size-4" />
                    {t("adminBroadcasts.actions.dispatchNow")}
                  </DropdownMenuItem>
                </>
              ) : null}

              {item.status === "Scheduled" ? (
                <>
                  <DropdownMenuItem
                    className="gap-2.5 text-[13px] text-destructive focus:text-destructive"
                    onSelect={() => onCancelSchedule(item)}
                  >
                    <XCircle className="size-4" />
                    {t("adminBroadcasts.actions.cancelSchedule")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2.5 text-[13px]"
                    onSelect={() => onDispatchNow(item)}
                  >
                    <Send className="size-4" />
                    {t("adminBroadcasts.actions.dispatchNow")}
                  </DropdownMenuItem>
                </>
              ) : null}

              <DropdownMenuItem
                className="gap-2.5 text-[13px] text-destructive focus:text-destructive"
                onSelect={() => onDelete(item)}
              >
                <Trash2 className="size-4" />
                {t("actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      className: "w-[6%] min-w-[48px]",
      header: <span className="sr-only">{t("adminBroadcasts.table.actions")}</span>,
      key: "actions",
    },
  ];

  if (!isLoading && items.length === 0) {
    if (hasFilters) {
      return (
        <EmptyState
          action={{
            label: t("adminBroadcasts.toolbar.clearFilters"),
            onClick: onClearFilters,
          }}
          description={t("adminBroadcasts.table.noMatchesDescription")}
          title={t("adminBroadcasts.table.noMatchesTitle")}
        />
      );
    }
    return (
      <EmptyState
        description={t("adminBroadcasts.table.emptyDescription")}
        title={t("adminBroadcasts.table.emptyTitle")}
      />
    );
  }

  // Active sort column header key
  const activeSortKey =
    Object.entries(BROADCAST_SORT_FIELD_BY_COLUMN).find(
      ([, val]) => val === sortBy,
    )?.[0] ?? "createdAt";

  return (
    <DataTable<BroadcastNotificationDto>
      className="table-fixed"
      columns={columns}
      isLoading={isLoading}
      onRowClick={(item) => onViewDetails(item)}
      onSort={(key) => {
        const field = BROADCAST_SORT_FIELD_BY_COLUMN[key];
        if (field && onSort) {
          onSort(field);
        }
      }}
      rowKey={(item) => item.id}
      rows={items}
      sort={{ direction: sortOrder, key: activeSortKey }}
    />
  );
}
