import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getApiV1Enterprises,
  getApiV1UsersById,
  getApiV1UsersByIdInvitation,
  getApiV1UsersByIdHistory,
  patchApiV1UsersById,
  patchApiV1UsersByIdEmergencySuspension,
  patchApiV1UsersByIdInvitation,
  patchApiV1UsersByIdRole,
  patchApiV1UsersByIdStatus,
  postApiV1UsersByIdEmailChangeRequests,
  postApiV1Users,
  postApiV1UsersByIdInvitationDeliveries,
} from "@/api/generated";
import { client } from "@/api/client";
import type {
  CancelInvitationRequest,
  CreateAdminUserRequest,
  EmergencyUserSuspensionRequest,
  GetApiV1UsersByIdHistoryData,
  PatchApiV1UsersByIdData,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  UserDto,
} from "@/api/generated/types.gen";

import { HISTORY_PAGE_SIZE, HISTORY_PREVIEW_SIZE } from "./user-history.constants";
import { ENTERPRISES_PAGE_SIZE, type UserSortField, type UserSortOrder } from "./users.constants";

export type UsersListParams = {
  enabled?: boolean;
  limit?: number;
  page: number;
  role?: Array<"user" | "admin" | "recruiter" | "enterprise_admin">;
  search?: string;
  status?: Array<"active" | "inactive" | "suspended" | "invited" | "blocked">;
  emailVerified?: boolean;
  enterpriseId?: string[];
  sortBy?: UserSortField;
  sortOrder?: UserSortOrder;
};

export const usersKeys = {
  all: ["admin-users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (params: UsersListParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (userId: string) => [...usersKeys.details(), userId] as const,
  enterprises: (keyword: string, page: number) => [...usersKeys.all, "enterprises", keyword, page] as const,
  invitation: (userId: string) => [...usersKeys.all, "invitation", userId] as const,
};

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export type AccountListResponse = { items: UserDto[]; total: number; page: number; limit: number; totalPages: number };

function throwApiError(error: unknown, status: number | undefined, fallback: string): never {
  const message = typeof error === "object" && error && "message" in error && typeof error.message === "string"
    ? error.message
    : fallback;
  const code = typeof error === "object" && error && "code" in error && typeof error.code === "string" ? error.code : undefined;
  throw Object.assign(new Error(message), { status, ...(code ? { code } : {}) });
}

export function useUsersListQuery(params: UsersListParams) {
  const { enabled = true, limit = DEFAULT_PAGE_SIZE, ...queryParams } = params;

  return useQuery({
    enabled,
    placeholderData: keepPreviousData,
    queryKey: usersKeys.list({ ...queryParams, limit }),
    queryFn: async () => {
      try {
        const result = await client.get<{ 200: AccountListResponse }>({
          url: "/api/v1/users",
          query: {
            limit,
            page: queryParams.page,
            ...(queryParams.search ? { search: queryParams.search } : {}),
            ...(queryParams.role?.length ? { role: queryParams.role.join(",") } : {}),
            ...(queryParams.emailVerified !== undefined ? { emailVerified: String(queryParams.emailVerified) } : {}),
            ...(queryParams.enterpriseId?.length ? { enterpriseId: queryParams.enterpriseId.join(",") } : {}),
            ...(queryParams.sortBy ? { sortBy: queryParams.sortBy } : {}),
            ...(queryParams.sortOrder ? { sortOrder: queryParams.sortOrder } : {}),
            ...(queryParams.status?.length ? { status: queryParams.status.join(",") } : {}),
          },
        });

        if (result.error) {
          throw Object.assign(result.error as object, { status: result.response?.status });
        }

        return result.data ?? { items: [] as UserDto[], total: 0, page: 1, limit, totalPages: 0 };
      } catch (err) {
        // If the backend has not yet implemented the list endpoint (404), return empty list gracefully
        const error = err as { status?: number };
        if (error.status === 404) {
          return { items: [] as UserDto[], total: 0, page: 1, limit, totalPages: 0 };
        }
        throw err;
      }
    },
  });
}

export function useActiveEnterprisesQuery(keyword: string, page: number, enabled = true) {
  return useQuery({
    enabled,
    queryKey: usersKeys.enterprises(keyword, page),
    queryFn: async () => {
      const result = await getApiV1Enterprises({ query: {
        status: "active",
        page,
        limit: ENTERPRISES_PAGE_SIZE,
        ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
      } });
      if (result.error || !result.data) throwApiError(result.error, result.response?.status, "Unable to load active companies");
      return result.data;
    },
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateAdminUserRequest) => {
      const result = await postApiV1Users({ body });
      if (result.error || !result.data) throwApiError(result.error, result.response?.status, "Unable to create the account");
      return result.data;
    },
    onSuccess: ({ user }) => {
      queryClient.setQueryData(usersKeys.detail(user.id), user);
      void queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

export function useUserInvitationQuery(userId: string, enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: usersKeys.invitation(userId),
    queryFn: async () => {
      const result = await getApiV1UsersByIdInvitation({ path: { id: userId } });
      if (result.error) throwApiError(result.error, result.response?.status, "Unable to load invitation status");
      return result.data ?? null;
    },
  });
}

export type HistoryFilters = Pick<NonNullable<GetApiV1UsersByIdHistoryData["query"]>, "action" | "actor" | "from" | "group" | "to">;

function historyQuery(filters: HistoryFilters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value)));
}

async function fetchHistory(userId: string, query: NonNullable<GetApiV1UsersByIdHistoryData["query"]>) {
  const result = await getApiV1UsersByIdHistory({ path: { id: userId }, query });
  if (result.error || !result.data) throwApiError(result.error, result.response?.status, "Unable to load account history");
  return result.data;
}

/** One page of history, e.g. the five most recent items on the detail page. */
export function useUserHistoryQuery(userId: string, enabled = true, options: { limit?: number } & HistoryFilters = {}) {
  const { limit = HISTORY_PREVIEW_SIZE, ...filters } = options;
  return useQuery({
    enabled,
    queryKey: [...usersKeys.detail(userId), "history", limit, filters],
    queryFn: () => fetchHistory(userId, { page: 1, limit, ...historyQuery(filters) }),
  });
}

/** Filtered history feed that accumulates pages for "Show older events". */
export function useUserHistoryFeedQuery(userId: string, filters: HistoryFilters, enabled = true) {
  return useInfiniteQuery({
    enabled,
    initialPageParam: 1,
    queryKey: [...usersKeys.detail(userId), "history-feed", filters],
    queryFn: ({ pageParam }) => fetchHistory(userId, { page: pageParam, limit: HISTORY_PAGE_SIZE, ...historyQuery(filters) }),
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useRequestEmailChangeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { newEmail: string; expectedVersion: number } }) => {
      const result = await postApiV1UsersByIdEmailChangeRequests({ path: { id }, body });
      if (result.error || !result.data) throwApiError(result.error, result.response?.status, "Unable to request an email change");
      return result.data;
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
    },
  });
}

function useAccountMutation<TBody>(
  mutation: (id: string, body: TBody) => Promise<UserDto>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TBody }) => mutation(id, body),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.detail(user.id) });
      void queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

export function useUpdateUserStatusMutation() {
  return useAccountMutation<UpdateUserStatusRequest>(async (id, body) => {
    const result = await patchApiV1UsersByIdStatus({ path: { id }, body });
    if (result.error || !result.data) throwApiError(result.error, result.response?.status, "Unable to change account status");
    return result.data;
  });
}

export function useEmergencySuspendUserMutation() {
  return useAccountMutation<EmergencyUserSuspensionRequest>(async (id, body) => {
    const result = await patchApiV1UsersByIdEmergencySuspension({ path: { id }, body });
    if (result.error || !result.data) throwApiError(result.error, result.response?.status, "Unable to suspend the account");
    return result.data;
  });
}

export function useUpdateUserRoleMutation() {
  return useAccountMutation<UpdateUserRoleRequest>(async (id, body) => {
    const result = await patchApiV1UsersByIdRole({ path: { id }, body });
    if (result.error || !result.data) throwApiError(result.error, result.response?.status, "Unable to change account role");
    return result.data;
  });
}

export function useCancelInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: CancelInvitationRequest }) => {
      const result = await patchApiV1UsersByIdInvitation({ path: { id }, body });
      if (result.error || !result.data) throwApiError(result.error, result.response?.status, "Unable to cancel invitation");
      return result.data;
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: usersKeys.invitation(id) });
      void queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

export function useResendInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await postApiV1UsersByIdInvitationDeliveries({ path: { id } });
      if (result.error || !result.data) throwApiError(result.error, result.response?.status, "Unable to send the invitation");
      return result.data;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: usersKeys.invitation(id) });
      void queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

export function useUserDetailQuery(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: usersKeys.detail(userId ?? ""),
    queryFn: async () => {
      const result = await getApiV1UsersById({ path: { id: userId as string } });

      if (result.error || !result.data) {
        throw Object.assign((result.error as object) ?? new Error("User not found"), {
          status: result.response?.status,
        });
      }

      return result.data;
    },
  });
}

export type UpdateUserInput = { body: PatchApiV1UsersByIdData["body"]; id: string };

/** UC-USER-03. Rejects with an Error whose `message` is the API's message and `status` its HTTP status. */
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ body, id }: UpdateUserInput): Promise<UserDto> => {
      const result = await patchApiV1UsersById({ body, path: { id } });
      if (result.error || !result.data) {
        const { message, code } = (result.error as { code?: string; message?: string } | undefined) ?? {};
        throw Object.assign(new Error(message ?? "Update failed"), { status: result.response?.status, ...(code ? { code } : {}) });
      }
      return result.data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(usersKeys.detail(user.id), user);
      void queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
