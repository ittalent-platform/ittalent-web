import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Calendar,
  CheckCircle2,
  FileText,
  Send,
  XCircle,
} from "lucide-react";

import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { TableSurface } from "@/components/common/data-table";
import { InlineErrorAlert } from "@/components/common/inline-error-alert";
import { useToast } from "@/components/toast/toast-provider";
import { Pagination } from "@/components/ui/pagination";
import { useListParams } from "@/hooks/use-list-params";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";

import { BroadcastDetailDialog } from "./broadcast-detail-drawer";
import {
  DEFAULT_PAGE_SIZE,
  useBroadcastsListQuery,
  useCancelScheduleMutation,
  useDispatchBroadcastMutation,
} from "./broadcast-notifications.queries";
import { BroadcastNotificationsTable } from "./broadcast-notifications-table";
import { BroadcastNotificationsToolbar } from "./broadcast-notifications-toolbar";
import type { BroadcastNotificationDto } from "./broadcast-notifications.types";
import { CreateBroadcastDialog } from "./create-broadcast-dialog";
import { DeleteBroadcastDialog } from "./delete-broadcast-dialog";
import { EditBroadcastDialog } from "./edit-broadcast-dialog";
import { ScheduleBroadcastDialog } from "./schedule-broadcast-dialog";

export function BroadcastNotificationsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { limit, page, search, set, setMany } = useListParams({
    defaultLimit: DEFAULT_PAGE_SIZE,
  });

  const commitSearch = useCallback(
    (value: string) => set("search", value || null),
    [set],
  );
  const [searchText, setSearchText] = useUrlSearchInput(search, commitSearch);

  const [status, setStatus] = useState<string>("all");
  const [audience, setAudience] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<"createdAt" | "scheduled_at" | "title" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const isDateRangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);

  // Dialog and drawer state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastNotificationDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Confirmation dialogs
  const [confirmDispatch, setConfirmDispatch] = useState<BroadcastNotificationDto | null>(null);
  const [confirmCancelSchedule, setConfirmCancelSchedule] = useState<BroadcastNotificationDto | null>(null);

  const dispatchMutation = useDispatchBroadcastMutation();
  const cancelScheduleMutation = useCancelScheduleMutation();

  const listQuery = useBroadcastsListQuery({
    audience: audience !== "all" ? audience : undefined,
    enabled: !isDateRangeInvalid,
    fromDate: isDateRangeInvalid ? undefined : (fromDate || undefined),
    limit,
    page,
    priority: priority !== "all" ? priority : undefined,
    search: search ? search.trim() : undefined,
    sortBy,
    sortOrder,
    status: status !== "all" ? status : undefined,
    toDate: isDateRangeInvalid ? undefined : (toDate || undefined),
  });

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = listQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / limit));
  const summary = useMemo(
    () =>
      listQuery.data?.summary ?? {
        drafts: 0,
        scheduled: 0,
        sent: 0,
        total: 0,
      },
    [listQuery.data?.summary],
  );

  const hasFilters =
    search.trim() !== "" ||
    status !== "all" ||
    audience !== "all" ||
    priority !== "all" ||
    Boolean(fromDate) ||
    Boolean(toDate);

  function handleResetFilters() {
    setSearchText("");
    setStatus("all");
    setAudience("all");
    setPriority("all");
    setFromDate("");
    setToDate("");
    setMany({ page: "1", search: null });
  }

  function handleSort(field: "createdAt" | "scheduled_at" | "title" | "status") {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "title" ? "asc" : "desc");
    }
  }

  function handleViewDetails(item: BroadcastNotificationDto) {
    setSelectedBroadcast(item);
    setIsDetailOpen(true);
  }

  function handleEdit(item: BroadcastNotificationDto) {
    setSelectedBroadcast(item);
    setIsEditOpen(true);
  }

  function handleSchedule(item: BroadcastNotificationDto) {
    setSelectedBroadcast(item);
    setIsScheduleOpen(true);
  }

  function handleDelete(item: BroadcastNotificationDto) {
    setSelectedBroadcast(item);
    setIsDeleteOpen(true);
  }

  async function executeDispatch(item: BroadcastNotificationDto) {
    try {
      await dispatchMutation.mutateAsync(item.id);
      showToast({
        message: t("adminBroadcasts.toast.dispatchedMessage", { title: item.title }),
        title: t("adminBroadcasts.toast.dispatchedTitle"),
        tone: "success",
      });
      setConfirmDispatch(null);
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : t("state.error", { defaultValue: "Failed to dispatch" }),
        title: t("state.error", { defaultValue: "Dispatch failed" }),
        tone: "error",
      });
    }
  }

  async function executeCancelSchedule(item: BroadcastNotificationDto) {
    try {
      await cancelScheduleMutation.mutateAsync(item.id);
      showToast({
        message: t("adminBroadcasts.toast.cancelScheduleMessage", { title: item.title }),
        title: t("adminBroadcasts.toast.cancelScheduleTitle"),
        tone: "success",
      });
      setConfirmCancelSchedule(null);
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : t("state.error", { defaultValue: "Failed to cancel schedule" }),
        title: t("state.error", { defaultValue: "Cancel failed" }),
        tone: "error",
      });
    }
  }

  const statCards = useMemo(
    () => [
      {
        icon: Bell,
        label: t("adminBroadcasts.stats.total"),
        tone: "bg-(--status-info-bg) text-(--status-info-fg)",
        value: summary.total,
      },
      {
        icon: FileText,
        label: t("adminBroadcasts.stats.drafts"),
        tone: "bg-(--status-neutral-bg) text-(--status-neutral-fg)",
        value: summary.drafts,
      },
      {
        icon: Calendar,
        label: t("adminBroadcasts.stats.scheduled"),
        tone: "bg-(--status-warning-bg) text-(--status-warning-fg)",
        value: summary.scheduled,
      },
      {
        icon: CheckCircle2,
        label: t("adminBroadcasts.stats.sent"),
        tone: "bg-(--status-success-bg) text-(--status-success-fg)",
        value: summary.sent,
      },
    ],
    [summary, t],
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description={t("adminBroadcasts.page.description")}
        title={t("adminBroadcasts.page.title")}
      />

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              className="rounded-xl border border-border bg-card p-4 shadow-2xs"
              key={card.label}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${card.tone}`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {card.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <BroadcastNotificationsToolbar
        audience={audience}
        fromDate={fromDate}
        onAudienceChange={setAudience}
        onCreateClick={() => setIsCreateOpen(true)}
        onFromDateChange={setFromDate}
        onPriorityChange={setPriority}
        onResetFilters={handleResetFilters}
        onSearchChange={setSearchText}
        onStatusChange={setStatus}
        onToDateChange={setToDate}
        priority={priority}
        search={searchText}
        status={status}
        toDate={toDate}
      />

      {isDateRangeInvalid ? (
        <InlineErrorAlert>
          {t("adminBroadcasts.toolbar.invalidDateRange")}
        </InlineErrorAlert>
      ) : null}

      {/* Data Table Surface */}
      <TableSurface>
        <BroadcastNotificationsTable
          hasFilters={hasFilters}
          isLoading={listQuery.isLoading}
          items={items}
          onCancelSchedule={(item) => setConfirmCancelSchedule(item)}
          onClearFilters={handleResetFilters}
          onDelete={handleDelete}
          onDispatchNow={(item) => setConfirmDispatch(item)}
          onEdit={handleEdit}
          onSchedule={handleSchedule}
          onSort={handleSort}
          onViewDetails={handleViewDetails}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      </TableSurface>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="mt-4 flex justify-end">
          <Pagination
            limit={limit}
            onLimitChange={(l) => set("limit", String(l))}
            onPageChange={(p) => set("page", String(p))}
            page={page}
            total={total}
            totalPages={totalPages}
          />
        </div>
      ) : null}

      {/* Create Dialog */}
      <CreateBroadcastDialog
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />

      {/* Edit Dialog */}
      <EditBroadcastDialog
        broadcast={selectedBroadcast}
        onOpenChange={setIsEditOpen}
        open={isEditOpen}
      />

      {/* Schedule Dialog */}
      <ScheduleBroadcastDialog
        broadcast={selectedBroadcast}
        onOpenChange={setIsScheduleOpen}
        open={isScheduleOpen}
      />

      {/* Detail Dialog */}
      <BroadcastDetailDialog
        broadcast={selectedBroadcast}
        onCancelSchedule={(item) => setConfirmCancelSchedule(item)}
        onDelete={handleDelete}
        onDispatchNow={(item) => setConfirmDispatch(item)}
        onEdit={handleEdit}
        onOpenChange={setIsDetailOpen}
        onSchedule={handleSchedule}
        open={isDetailOpen}
      />

      {/* Delete Dialog */}
      <DeleteBroadcastDialog
        broadcast={selectedBroadcast}
        onOpenChange={setIsDeleteOpen}
        open={isDeleteOpen}
      />

      {/* ActionConfirmDialog for Dispatch Now */}
      {confirmDispatch ? (
        <ActionConfirmDialog
          action={t("adminBroadcasts.actions.dispatchNow")}
          cancelLabel={t("actions.cancel")}
          description={t("adminBroadcasts.dialog.dispatchNowConfirm", {
            audience: t(`adminBroadcasts.audience.${confirmDispatch.targetAudience}`, {
              defaultValue: confirmDispatch.targetAudience,
            }),
            title: confirmDispatch.title,
          })}
          disabled={dispatchMutation.isPending}
          icon={Send}
          keepOpenOnConfirm
          onConfirm={() => void executeDispatch(confirmDispatch)}
          onOpenChange={(next) => {
            if (!next) setConfirmDispatch(null);
          }}
          open={Boolean(confirmDispatch)}
          title={t("adminBroadcasts.dialog.dispatchNowTitle")}
          variant="warning-solid"
        />
      ) : null}

      {/* ActionConfirmDialog for Cancel Schedule */}
      {confirmCancelSchedule ? (
        <ActionConfirmDialog
          action={t("adminBroadcasts.actions.cancelSchedule")}
          cancelLabel={t("actions.cancel")}
          description={t("adminBroadcasts.dialog.cancelScheduleConfirm", {
            title: confirmCancelSchedule.title,
          })}
          disabled={cancelScheduleMutation.isPending}
          icon={XCircle}
          keepOpenOnConfirm
          onConfirm={() => void executeCancelSchedule(confirmCancelSchedule)}
          onOpenChange={(next) => {
            if (!next) setConfirmCancelSchedule(null);
          }}
          open={Boolean(confirmCancelSchedule)}
          title={t("adminBroadcasts.dialog.cancelScheduleTitle")}
          variant="destructive-solid"
        />
      ) : null}
    </div>
  );
}
