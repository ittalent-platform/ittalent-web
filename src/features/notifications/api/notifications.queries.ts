import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";

import {
  deleteApiV1Notifications,
  deleteApiV1NotificationsById,
  getApiV1Notifications,
  getApiV1NotificationsUnreadCount,
  patchApiV1NotificationsByIdRead,
  patchApiV1NotificationsReadAll,
} from "@/api/generated";
import type {
  DeleteAllNotificationsResponse,
  DeleteNotificationResponse,
  MarkAllReadResponse,
  NotificationItemDto,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/api/generated/types.gen";
import { unwrap } from "@/api/request-error";

import type { NotificationListParams } from "@/features/notifications/types";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params: NotificationListParams) => [...notificationKeys.lists(), params] as const,
  infiniteLists: () => [...notificationKeys.all, "infinite-list"] as const,
  infiniteList: (params: NotificationListParams) => [...notificationKeys.infiniteLists(), params] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export const NOTIFICATIONS_PAGE_SIZE = 10;

export function useInfiniteNotificationsQuery(
  params: NotificationListParams,
  enabled = true,
) {
  const queryParams = { ...params, limit: params.limit ?? NOTIFICATIONS_PAGE_SIZE };
  return useInfiniteQuery<NotificationListResponse>({
    enabled,
    initialPageParam: 1,
    queryKey: notificationKeys.infiniteList(queryParams),
    queryFn: async ({ pageParam }) =>
      unwrap(
        await getApiV1Notifications({
          query: {
            ...queryParams,
            page: pageParam as number,
          },
        }),
        "Could not load notifications.",
      ),
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useNotificationsQuery(params: NotificationListParams, enabled = true) {
  return useQuery<NotificationListResponse>({
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => unwrap(await getApiV1Notifications({ query: params }), "Could not load notifications."),
    queryKey: notificationKeys.list(params),
  });
}

export function useUnreadCountQuery(enabled = true) {
  return useQuery<UnreadCountResponse>({
    enabled,
    queryFn: async () => unwrap(await getApiV1NotificationsUnreadCount(), "Could not load unread count."),
    queryKey: notificationKeys.unreadCount(),
    staleTime: 15_000,
  });
}

/**
 * Synchronously updates cached items and metadata in both standard list queries and infinite list queries.
 */
export function updateAllLists(
  queryClient: QueryClient,
  updater: (items: NotificationItemDto[]) => NotificationItemDto[],
  metaUpdater?: (prev: { total: number; unreadCount: number }) => { total: number; unreadCount: number },
) {
  queryClient.setQueriesData<NotificationListResponse>(
    { queryKey: notificationKeys.lists() },
    (old: NotificationListResponse | undefined) => {
      if (!old) return old;
      const newItems = updater(old.items);
      const meta = metaUpdater
        ? metaUpdater({ total: old.total, unreadCount: old.unreadCount })
        : { total: old.total, unreadCount: old.unreadCount };
      return {
        ...old,
        items: newItems,
        total: meta.total,
        unreadCount: meta.unreadCount,
      };
    },
  );

  queryClient.setQueriesData<InfiniteData<NotificationListResponse>>(
    { queryKey: notificationKeys.infiniteLists() },
    (old: InfiniteData<NotificationListResponse> | undefined) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: NotificationListResponse) => {
          const newItems = updater(page.items);
          const meta = metaUpdater
            ? metaUpdater({ total: page.total, unreadCount: page.unreadCount })
            : { total: page.total, unreadCount: page.unreadCount };
          return {
            ...page,
            items: newItems,
            total: meta.total,
            unreadCount: meta.unreadCount,
          };
        }),
      };
    },
  );
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<NotificationItemDto, Error, { id: string }, { previousLists: Array<[readonly unknown[], NotificationListResponse | undefined]>; previousCount: UnreadCountResponse | undefined }>({
    mutationFn: async ({ id }: { id: string }) =>
      unwrap(await patchApiV1NotificationsByIdRead({ path: { id } }), "Couldn't mark as read."),
    onError: (_err, _variables, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousCount);
      }
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousLists = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: notificationKeys.lists(),
      });
      const previousCount = queryClient.getQueryData<UnreadCountResponse>(notificationKeys.unreadCount());

      // Optimistically update matching notification in all cached lists
      let wasUnread = false;
      const targetInCache = previousLists
        .flatMap(([, data]) => data?.items ?? [])
        .find((item) => item.id === id);
      if (targetInCache && !targetInCache.isRead) {
        wasUnread = true;
      }

      updateAllLists(
        queryClient,
        (items) =>
          items.map((item) => {
            if (item.id === id) {
              if (!item.isRead) wasUnread = true;
              return { ...item, isRead: true, readAt: new Date().toISOString() };
            }
            return item;
          }),
        (meta) => ({
          ...meta,
          unreadCount: wasUnread ? Math.max(0, meta.unreadCount - 1) : meta.unreadCount,
        }),
      );

      if (wasUnread && previousCount) {
        queryClient.setQueryData<UnreadCountResponse>(notificationKeys.unreadCount(), {
          unreadCount: Math.max(0, previousCount.unreadCount - 1),
        });
      }

      return { previousCount, previousLists };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation<
    MarkAllReadResponse,
    Error,
    { before?: string } | void,
    { previousLists: Array<[readonly unknown[], NotificationListResponse | undefined]>; previousCount: UnreadCountResponse | undefined }
  >({
    mutationFn: async (variables) =>
      unwrap(
        await patchApiV1NotificationsReadAll({
          query: variables?.before ? { before: variables.before } : undefined,
        }),
        "Couldn't mark all notifications as read.",
      ),
    onError: (_err, _variables, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousCount);
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousLists = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: notificationKeys.lists(),
      });
      const previousCount = queryClient.getQueryData<UnreadCountResponse>(notificationKeys.unreadCount());

      const cutoffDate = variables?.before ? new Date(variables.before) : null;
      let newlyMarkedCount = 0;

      updateAllLists(
        queryClient,
        (items) =>
          items.map((item) => {
            if (item.isRead) return item;
            if (cutoffDate && item.createdAt && new Date(item.createdAt) > cutoffDate) {
              return item;
            }
            newlyMarkedCount += 1;
            return { ...item, isRead: true, readAt: new Date().toISOString() };
          }),
        (meta) => ({
          ...meta,
          unreadCount: cutoffDate
            ? Math.max(0, meta.unreadCount - newlyMarkedCount)
            : 0,
        }),
      );

      if (previousCount) {
        queryClient.setQueryData<UnreadCountResponse>(notificationKeys.unreadCount(), {
          unreadCount: cutoffDate
            ? Math.max(0, previousCount.unreadCount - newlyMarkedCount)
            : 0,
        });
      }

      return { previousCount, previousLists };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation<DeleteNotificationResponse, Error, { id: string }, { previousLists: Array<[readonly unknown[], NotificationListResponse | undefined]>; previousCount: UnreadCountResponse | undefined }>({
    mutationFn: async ({ id }: { id: string }) =>
      unwrap(await deleteApiV1NotificationsById({ path: { id } }), "Couldn't delete this notification."),
    onError: (_err, _variables, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousCount);
      }
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousLists = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: notificationKeys.lists(),
      });
      const previousCount = queryClient.getQueryData<UnreadCountResponse>(notificationKeys.unreadCount());

      let wasUnread = false;
      const targetInCache = previousLists
        .flatMap(([, data]) => data?.items ?? [])
        .find((item) => item.id === id);
      if (targetInCache && !targetInCache.isRead) {
        wasUnread = true;
      }

      updateAllLists(
        queryClient,
        (items) => items.filter((item) => item.id !== id),
        (meta) => ({
          total: Math.max(0, meta.total - 1),
          unreadCount: wasUnread ? Math.max(0, meta.unreadCount - 1) : meta.unreadCount,
        }),
      );

      if (wasUnread && previousCount) {
        queryClient.setQueryData<UnreadCountResponse>(notificationKeys.unreadCount(), {
          unreadCount: Math.max(0, previousCount.unreadCount - 1),
        });
      }

      return { previousCount, previousLists };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation<DeleteAllNotificationsResponse, Error, void, { previousLists: Array<[readonly unknown[], NotificationListResponse | undefined]>; previousCount: UnreadCountResponse | undefined }>({
    mutationFn: async () => unwrap(await deleteApiV1Notifications(), "Couldn't delete all notifications."),
    onError: (_err, _variables, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousCount);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousLists = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: notificationKeys.lists(),
      });
      const previousCount = queryClient.getQueryData<UnreadCountResponse>(notificationKeys.unreadCount());

      updateAllLists(
        queryClient,
        () => [],
        () => ({ total: 0, unreadCount: 0 }),
      );

      queryClient.setQueryData<UnreadCountResponse>(notificationKeys.unreadCount(), { unreadCount: 0 });

      return { previousCount, previousLists };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
