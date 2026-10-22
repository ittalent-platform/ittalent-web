import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/api/client';
import { unwrap } from '@/api/request-error';
import type {
  BroadcastListParams,
  BroadcastListResponse,
  BroadcastNotificationDto,
  CreateBroadcastInput,
  ScheduleBroadcastInput,
  UpdateBroadcastInput,
} from './broadcast-notifications.types';

export const broadcastsKeys = {
  all: ['admin-broadcast-notifications'] as const,
  lists: () => [...broadcastsKeys.all, 'list'] as const,
  list: (params: BroadcastListParams) => [...broadcastsKeys.lists(), params] as const,
  details: () => [...broadcastsKeys.all, 'detail'] as const,
  detail: (id: string) => [...broadcastsKeys.details(), id] as const,
};

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export function useBroadcastsListQuery(params: BroadcastListParams) {
  const { enabled = true, limit = DEFAULT_PAGE_SIZE, ...queryParams } = params;

  return useQuery({
    enabled,
    queryKey: broadcastsKeys.list({ ...queryParams, limit }),
    queryFn: async (): Promise<BroadcastListResponse> => {
      const res = await client.get<{ 200: BroadcastListResponse }>({
        url: '/api/v1/broadcast-notifications',
        query: {
          limit,
          page: queryParams.page,
          ...(queryParams.search ? { search: queryParams.search } : {}),
          ...(queryParams.status && queryParams.status !== 'all' && queryParams.status !== 'All'
            ? { status: queryParams.status }
            : {}),
          ...(queryParams.audience && queryParams.audience !== 'all' && queryParams.audience !== 'All'
            ? { audience: queryParams.audience }
            : {}),
          ...(queryParams.priority && queryParams.priority !== 'all' && queryParams.priority !== 'All'
            ? { priority: queryParams.priority }
            : {}),
          ...(queryParams.fromDate ? { fromDate: queryParams.fromDate } : {}),
          ...(queryParams.toDate ? { toDate: queryParams.toDate } : {}),
          ...(queryParams.sortBy ? { sortBy: queryParams.sortBy } : {}),
          ...(queryParams.sortOrder ? { sortOrder: queryParams.sortOrder } : {}),
        },
      });

      return unwrap(res, 'Failed to fetch broadcast notifications');
    },
  });
}

export function useBroadcastDetailQuery(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: broadcastsKeys.detail(id ?? ''),
    queryFn: async (): Promise<BroadcastNotificationDto> => {
      const res = await client.get<{ 200: { success: boolean; data: BroadcastNotificationDto } }>({
        url: `/api/v1/broadcast-notifications/${id}`,
      });
      const data = unwrap(res, 'Failed to fetch broadcast notification detail');
      return data.data;
    },
  });
}

export function useCreateBroadcastMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBroadcastInput): Promise<BroadcastNotificationDto> => {
      const res = await client.post<{ 201: { success: boolean; data: BroadcastNotificationDto } }>({
        url: '/api/v1/broadcast-notifications',
        body: payload,
      });
      const data = unwrap(res, 'Failed to create broadcast notification');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: broadcastsKeys.lists() });
    },
  });
}

export function useUpdateBroadcastMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBroadcastInput;
    }): Promise<BroadcastNotificationDto> => {
      const res = await client.patch<{ 200: { success: boolean; data: BroadcastNotificationDto } }>({
        url: `/api/v1/broadcast-notifications/${id}`,
        body: payload,
      });
      const data = unwrap(res, 'Failed to update broadcast notification');
      return data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: broadcastsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: broadcastsKeys.detail(id) });
    },
  });
}

export function useScheduleBroadcastMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ScheduleBroadcastInput;
    }): Promise<BroadcastNotificationDto> => {
      const res = await client.post<{ 200: { success: boolean; data: BroadcastNotificationDto } }>({
        url: `/api/v1/broadcast-notifications/${id}/schedule`,
        body: payload,
      });
      const data = unwrap(res, 'Failed to schedule broadcast notification');
      return data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: broadcastsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: broadcastsKeys.detail(id) });
    },
  });
}

export function useCancelScheduleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<BroadcastNotificationDto> => {
      const res = await client.post<{ 200: { success: boolean; data: BroadcastNotificationDto } }>({
        url: `/api/v1/broadcast-notifications/${id}/cancel-schedule`,
      });
      const data = unwrap(res, 'Failed to cancel scheduled dispatch');
      return data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: broadcastsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: broadcastsKeys.detail(id) });
    },
  });
}

export function useDispatchBroadcastMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<BroadcastNotificationDto> => {
      const res = await client.post<{ 200: { success: boolean; data: BroadcastNotificationDto } }>({
        url: `/api/v1/broadcast-notifications/${id}/dispatch`,
      });
      const data = unwrap(res, 'Failed to dispatch broadcast notification');
      return data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: broadcastsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: broadcastsKeys.detail(id) });
    },
  });
}

export function useDeleteBroadcastMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean; message: string }> => {
      const res = await client.delete<{ 200: { success: boolean; message: string } }>({
        url: `/api/v1/broadcast-notifications/${id}`,
      });
      return unwrap(res, 'Failed to delete broadcast notification');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: broadcastsKeys.lists() });
    },
  });
}
