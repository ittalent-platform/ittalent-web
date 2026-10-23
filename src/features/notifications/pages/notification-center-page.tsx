import { CheckCheck, MoreVertical, RotateCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { PageHeader } from "@/components/common/admin-page-header";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import {
  NOTIFICATIONS_PAGE_SIZE,
  useDeleteAllNotifications,
  useDeleteNotification,
  useInfiniteNotificationsQuery,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
  useUnreadCountQuery,
} from "@/features/notifications/api/notifications.queries";
import { AnnouncementDetailDialog } from "@/features/notifications/components/announcement-detail-dialog";
import { NotificationItemRow } from "@/features/notifications/components/notification-item-row";
import {
  tabToNotificationQuery,
  type NotificationItem,
  type NotificationTab,
} from "@/features/notifications/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Personal Notification Center Inbox page matching exact design specifications:
 * - Header: PageHeader with Space Grotesk title, dynamic unread count / "All caught up" subtitle
 * - Header Actions: "Mark all as read" Button and More Actions dropdown
 * - Tabs: "All", "Unread", "Announcements" with respective live count badges
 * - Card Container: 16px rounded border-box container
 * - Notification rows: NotificationItemRow with unread dots, category chips, 2-line clamp, and hover action swap
 * - Pagination: "Showing X of Y" and "Show older" button
 * - Empty states: contextual feedback for each empty tab
 */
export function NotificationCenterPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab: NotificationTab =
    tabParam === "unread" || tabParam === "announcements" ? tabParam : "all";

  const { showToast } = useToast();
  const [showMarkAllDialog, setShowMarkAllDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [capturedDeleteCount, setCapturedDeleteCount] = useState<number | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<NotificationItem | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const pendingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Queries
  const unreadCountQuery = useUnreadCountQuery();
  const unreadCount = unreadCountQuery.data?.unreadCount ?? 0;

  const notificationsQuery = useInfiniteNotificationsQuery(
    tabToNotificationQuery(activeTab, { limit: NOTIFICATIONS_PAGE_SIZE }),
  );

  // Counts for tabs (gated: only run when tab is not active to prevent redundant queries & count race conditions)
  const allCountQuery = useNotificationsQuery(
    tabToNotificationQuery("all", { page: 1, limit: 1 }),
    activeTab !== "all",
  );
  const announcementsCountQuery = useNotificationsQuery(
    tabToNotificationQuery("announcements", { page: 1, limit: 1 }),
    activeTab !== "announcements",
  );

  const items = useMemo(
    () => notificationsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [notificationsQuery.data?.pages],
  );
  const totalCount = notificationsQuery.data?.pages[0]?.total ?? 0;

  const allTabCount = activeTab === "all" ? totalCount : (allCountQuery.data?.total ?? 0);
  const announcementsTabCount =
    activeTab === "announcements" ? totalCount : (announcementsCountQuery.data?.total ?? 0);

  // Filter out any items currently in the 5-second undo deletion window
  const visibleItems = useMemo(
    () => items.filter((item) => !pendingDeleteIds.has(item.id)),
    [items, pendingDeleteIds],
  );

  // Mutations
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();
  const deleteAllMutation = useDeleteAllNotifications();

  const deleteMutationRef = useRef(deleteMutation);
  deleteMutationRef.current = deleteMutation;

  // Commit any pending deletions upon unmount
  useEffect(() => {
    return () => {
      pendingTimersRef.current.forEach((timer, id) => {
        clearTimeout(timer);
        deleteMutationRef.current.mutate({ id });
      });
      pendingTimersRef.current.clear();
    };
  }, []);

  const handleTabChange = (nextTab: NotificationTab) => {
    setSearchParams(
      (prev) => {
        if (nextTab === "all") {
          prev.delete("tab");
        } else {
          prev.set("tab", nextTab);
        }
        return prev;
      },
      { replace: true },
    );
  };

  const tabs: Array<{ key: NotificationTab; label: string; count: number }> = [
    {
      key: "all",
      label: t("notifications.tabs.all", { defaultValue: "All" }),
      count: allTabCount,
    },
    {
      key: "unread",
      label: t("notifications.tabs.unread", { defaultValue: "Unread" }),
      count: unreadCount,
    },
    {
      key: "announcements",
      label: t("notifications.tabs.announcements", { defaultValue: "Announcements" }),
      count: announcementsTabCount,
    },
  ];

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(
      { id },
      {
        onError: () => {
          showToast({
            title: "",
            message: t("notifications.markReadError", {
              defaultValue: "Couldn’t mark as read. Try again",
            }),
            tone: "error",
          });
        },
      },
    );
  };

  const handleOpenMarkAllDialog = () => {
    if (unreadCount > 0 && !markAllReadMutation.isPending) {
      setShowMarkAllDialog(true);
    }
  };

  const handleConfirmMarkAllAsRead = () => {
    if (unreadCount > 0 && !markAllReadMutation.isPending) {
      markAllReadMutation.mutate(undefined, {
        onSuccess: () => {
          setShowMarkAllDialog(false);
        },
        onError: () => {
          setShowMarkAllDialog(false);
          showToast({
            title: "",
            message: t("notifications.markAllError", {
              count: unreadCount,
              defaultValue: `Nothing was marked as read. Something went wrong on our side. You still have ${unreadCount} unread notifications.`,
            }),
            tone: "error",
          });
        },
      });
    }
  };

  const handleDeleteItem = (id: string) => {
    // Optimistically hide row from the list immediately
    setPendingDeleteIds((prev) => new Set(prev).add(id));

    // Schedule actual mutation execution after 5000ms
    const timer = setTimeout(() => {
      pendingTimersRef.current.delete(id);
      setPendingDeleteIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      deleteMutation.mutate(
        { id },
        {
          onError: () => {
            showToast({
              title: "",
              message: t("notifications.deleteError", {
                defaultValue: "Couldn’t delete this notification. Try again",
              }),
              tone: "error",
            });
          },
        },
      );
    }, 5000);

    pendingTimersRef.current.set(id, timer);

    // Show 5-second undo toast
    showToast({
      title: "",
      message: t("notifications.deleted", { defaultValue: "Notification deleted" }),
      tone: "success",
      durationMs: 5000,
      action: {
        label: t("common.undo", { defaultValue: "Undo" }),
        onClick: () => {
          const activeTimer = pendingTimersRef.current.get(id);
          if (activeTimer) {
            clearTimeout(activeTimer);
            pendingTimersRef.current.delete(id);
          }
          setPendingDeleteIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      },
    });
  };

  const handleOpenDeleteAllDialog = () => {
    setCapturedDeleteCount(allTabCount);
    setShowDeleteAllDialog(true);
  };

  const isStaleBatch =
    showDeleteAllDialog &&
    capturedDeleteCount !== null &&
    allTabCount !== capturedDeleteCount;

  const activeDeleteCount = isStaleBatch ? allTabCount : (capturedDeleteCount ?? allTabCount);

  const handleDeleteAll = () => {
    if (allTabCount > 0 && !deleteAllMutation.isPending) {
      deleteAllMutation.mutate(undefined, {
        onSuccess: () => {
          setShowDeleteAllDialog(false);
          setCapturedDeleteCount(null);
        },
      });
    }
  };

  const handleSelectItem = (item: NotificationItem) => {
    if (item.type === "system_announcement") {
      if (!item.isRead && item.id) {
        handleMarkRead(item.id);
      }
      setSelectedAnnouncement(item);
    }
  };

  return (
    <div className="flex w-full flex-col gap-5" data-testid="notification-center-page">
      {/* Zone 1: Page Header & Global Actions (Reusing PageHeader & Button) */}
      <PageHeader
        actions={
          <div className="flex items-center gap-3">
            <Button
              className={cn(
                "font-semibold",
                unreadCount === 0 &&
                  "border-0 bg-muted text-muted-foreground cursor-not-allowed opacity-100",
              )}
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
              onClick={handleOpenMarkAllDialog}
              shape="xl"
              size="xl"
              type="button"
              variant="outline"
            >
              <CheckCheck className="size-4" />
              {unreadCount > 0
                ? t("notifications.markAllAsRead", { defaultValue: "Mark all as read" })
                : t("notifications.allCaughtUp", { defaultValue: "All caught up" })}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={t("notifications.moreActions", { defaultValue: "More actions" })}
                  className="size-11 text-muted-foreground hover:text-foreground"
                  shape="xl"
                  type="button"
                  variant="outline"
                >
                  <MoreVertical className="size-[18px]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-[14px] p-1.5 shadow-xl">
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={unreadCount === 0 || markAllReadMutation.isPending}
                  onClick={handleOpenMarkAllDialog}
                >
                  <CheckCheck className="size-4" />
                  <span>{t("notifications.markAllAsRead", { defaultValue: "Mark all as read" })}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer font-semibold"
                  disabled={allTabCount === 0 || deleteAllMutation.isPending}
                  onClick={handleOpenDeleteAllDialog}
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  <span>{t("notifications.deleteAll", { defaultValue: "Delete all…" })}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        description={
          unreadCount > 0
            ? t("notifications.unreadCount", {
                count: unreadCount,
                defaultValue: `${unreadCount} unread`,
              })
            : t("notifications.allCaughtUp", { defaultValue: "All caught up" })
        }
        title={t("notifications.title", { defaultValue: "Notifications" })}
      />

      {/* Zone 2 & 3: Tabs & Card Container */}
      <div className="w-full overflow-hidden rounded-[16px] border border-border bg-card">
        {/* Tab Tray */}
        <div
          aria-label={t("notifications.title", { defaultValue: "Notifications" })}
          className="flex gap-6 border-b border-border bg-card px-5 pt-1 sm:px-6"
          role="tablist"
        >
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                aria-controls={`tabpanel-${tab.key}`}
                aria-selected={isSelected}
                className={cn(
                  "inline-flex h-10 items-center gap-2 border-b-2 px-0.5 text-[14px] transition-colors cursor-pointer",
                  isSelected
                    ? "border-brand font-bold text-foreground"
                    : "border-transparent font-medium text-muted-foreground hover:text-foreground",
                )}
                id={`tab-${tab.key}`}
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                role="tab"
                type="button"
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[12px] font-bold",
                    isSelected
                      ? "bg-ember-wash text-fg-link"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Panel Body */}
        <div
          aria-labelledby={`tab-${activeTab}`}
          className="min-w-0"
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
        >
          {notificationsQuery.isLoading && visibleItems.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <span className="text-[13.5px]">{t("common.loading", { defaultValue: "Loading..." })}</span>
            </div>
          ) : visibleItems.length > 0 ? (
            <div
              aria-label={t("notifications.title", { defaultValue: "Notifications" })}
              className="-mt-px"
              role="list"
            >
            {visibleItems.map((item: NotificationItem) => (
              <NotificationItemRow
                item={item}
                key={item.id}
                onDelete={handleDeleteItem}
                onMarkRead={handleMarkRead}
                onSelect={handleSelectItem}
              />
            ))}
          </div>
        ) : (
          /* Contextual empty states matching design specs */
          <div className="flex flex-col gap-2 p-8 text-left sm:p-10">
            {activeTab === "unread" ? (
              <>
                <span className="font-['Space_Grotesk'] text-[19px] font-semibold text-foreground">
                  {t("notifications.empty.allCaughtUp", { defaultValue: "You’re all caught up" })}
                </span>
                <span className="text-[13.5px] text-muted-foreground">
                  {t("notifications.empty.allCaughtUpDesc", {
                    defaultValue: "No unread notifications. Older ones are under All.",
                  })}
                </span>
              </>
            ) : activeTab === "announcements" ? (
              <>
                <span className="font-['Space_Grotesk'] text-[19px] font-semibold text-foreground">
                  {t("notifications.empty.noAnnouncements", { defaultValue: "No announcements" })}
                </span>
                <span className="text-[13.5px] text-muted-foreground">
                  {t("notifications.empty.noAnnouncementsDesc", {
                    defaultValue: "News from ITTalent shows up here.",
                  })}
                </span>
              </>
            ) : (
              <>
                <span className="font-['Space_Grotesk'] text-[19px] font-semibold text-foreground">
                  {t("notifications.empty.noNotifications", {
                    defaultValue: "No notifications yet",
                  })}
                </span>
                <span className="text-[13.5px] text-muted-foreground">
                  {t("notifications.empty.noNotificationsDesc", {
                    defaultValue:
                      "We’ll let you know here when a company reviews your application or schedules an interview.",
                  })}
                </span>
              </>
            )}
          </div>
        )}

        {/* Zone 5: Pagination Footer */}
        {visibleItems.length > 0 && (
          <div className="flex items-center justify-between border-t border-line-muted px-6 py-3.5">
            <span className="text-[13px] text-muted-foreground">
              {t("notifications.showingCount", {
                defaultValue: `Showing ${visibleItems.length} of ${Math.max(0, totalCount - pendingDeleteIds.size)}`,
                shown: visibleItems.length,
                total: Math.max(0, totalCount - pendingDeleteIds.size),
              })}
            </span>
            {Boolean(notificationsQuery.hasNextPage) && (
              <button
                className="inline-flex h-10 items-center justify-center rounded-[12px] border border-border bg-card px-4 text-[14px] font-semibold text-foreground transition-colors hover:bg-muted cursor-pointer disabled:opacity-50"
                disabled={!notificationsQuery.hasNextPage || notificationsQuery.isFetchingNextPage}
                onClick={() => notificationsQuery.fetchNextPage()}
                type="button"
              >
                {notificationsQuery.isFetchingNextPage
                  ? t("common.loading", { defaultValue: "Loading..." })
                  : t("notifications.showOlder", { defaultValue: "Show older" })}
              </button>
            )}
          </div>
        )}
        </div>
      </div>

      <ActionConfirmDialog
        action={
          isStaleBatch
            ? t("notifications.staleBatchBtn", {
                count: activeDeleteCount,
                defaultValue: `Delete ${activeDeleteCount} notifications`,
              })
            : t("notifications.deleteAllBtnCount", {
                count: activeDeleteCount,
                defaultValue: `Delete ${activeDeleteCount} notifications`,
              })
        }
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        description={
          isStaleBatch
            ? t("notifications.staleBatchDesc", {
                count: allTabCount,
                oldCount: capturedDeleteCount,
                defaultValue: `You now have ${allTabCount} notifications, not ${capturedDeleteCount}. Nothing was deleted yet.`,
              })
            : t("notifications.deleteAllConfirmDesc", {
                defaultValue:
                  "This removes every notification in your list right now. Ones that arrive after you confirm are kept. Your applications and interviews aren't affected.",
              })
        }
        disabled={deleteAllMutation.isPending}
        icon={isStaleBatch ? RotateCw : Trash2}
        iconVariant={isStaleBatch ? "warning-solid" : undefined}
        onConfirm={handleDeleteAll}
        onOpenChange={(open) => {
          setShowDeleteAllDialog(open);
          if (!open) {
            setCapturedDeleteCount(null);
          }
        }}
        open={showDeleteAllDialog}
        title={
          isStaleBatch
            ? t("notifications.staleBatchTitle", {
                defaultValue: "Your notifications changed",
              })
            : t("notifications.deleteAllConfirmTitle", {
                count: activeDeleteCount,
                defaultValue: `Delete ${activeDeleteCount} notifications?`,
              })
        }
        variant="destructive-solid"
      />

      <ActionConfirmDialog
        action={t("notifications.markAllAsRead", { defaultValue: "Mark as read" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        description={t("notifications.markAllAsReadConfirmDesc", {
          defaultValue:
            "Only notifications you can see now are marked. Anything that arrives after you confirm stays unread.",
        })}
        disabled={markAllReadMutation.isPending}
        icon={CheckCheck}
        onConfirm={handleConfirmMarkAllAsRead}
        onOpenChange={setShowMarkAllDialog}
        open={showMarkAllDialog}
        title={t("notifications.markAllAsReadConfirmTitle", {
          count: unreadCount,
          defaultValue: `Mark ${unreadCount} notifications as read?`,
        })}
        variant="default"
      />

      <AnnouncementDetailDialog
        item={selectedAnnouncement}
        onDelete={handleDeleteItem}
        onOpenChange={(open) => {
          if (!open) setSelectedAnnouncement(null);
        }}
        open={Boolean(selectedAnnouncement)}
      />
    </div>
  );
}
