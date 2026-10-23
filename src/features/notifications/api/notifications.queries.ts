import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
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
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: notificationKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => {
              if (item.id === id) {
                if (!item.isRead) wasUnread = true;
                return { ...item, isRead: true, readAt: new Date().toISOString() };
              }
              return item;
            }),
            unreadCount: wasUnread ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
          };
        },
      );

      queryClient.setQueriesData<InfiniteData<NotificationListResponse>>(
        { queryKey: notificationKeys.infiniteLists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => {
                if (item.id === id) {
                  return { ...item, isRead: true, readAt: new Date().toISOString() };
                }
                return item;
              }),
              unreadCount: wasUnread ? Math.max(0, page.unreadCount - 1) : page.unreadCount,
            })),
          };
        },
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
  return useMutation<MarkAllReadResponse, Error, void, { previousLists: Array<[readonly unknown[], NotificationListResponse | undefined]>; previousCount: UnreadCountResponse | undefined }>({
    mutationFn: async () => unwrap(await patchApiV1NotificationsReadAll(), "Couldn't mark all notifications as read."),
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

      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: notificationKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })),
            unreadCount: 0,
          };
        },
      );

      queryClient.setQueriesData<InfiniteData<NotificationListResponse>>(
        { queryKey: notificationKeys.infiniteLists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })),
              unreadCount: 0,
            })),
          };
        },
      );

      queryClient.setQueryData<UnreadCountResponse>(notificationKeys.unreadCount(), { unreadCount: 0 });

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
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: notificationKeys.lists() },
        (old) => {
          if (!old) return old;
          const target = old.items.find((item) => item.id === id);
          if (target && !target.isRead) wasUnread = true;
          return {
            ...old,
            items: old.items.filter((item) => item.id !== id),
            total: Math.max(0, old.total - 1),
            unreadCount: wasUnread ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
          };
        },
      );

      queryClient.setQueriesData<InfiniteData<NotificationListResponse>>(
        { queryKey: notificationKeys.infiniteLists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.id !== id),
              total: Math.max(0, page.total - 1),
              unreadCount: wasUnread ? Math.max(0, page.unreadCount - 1) : page.unreadCount,
            })),
          };
        },
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

      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: notificationKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: [],
            total: 0,
            unreadCount: 0,
          };
        },
      );

      queryClient.setQueriesData<InfiniteData<NotificationListResponse>>(
        { queryKey: notificationKeys.infiniteLists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: [],
              total: 0,
              unreadCount: 0,
            })),
          };
        },
      );

      queryClient.setQueryData<UnreadCountResponse>(notificationKeys.unreadCount(), { unreadCount: 0 });

      return { previousCount, previousLists };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
