import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiV1UsersById, patchApiV1UsersById } from "@/api/generated";
import { client } from "@/api/client";
import type { PatchApiV1UsersByIdData, UserDto } from "@/api/generated/types.gen";

import type { UserSortField, UserSortOrder } from "./users.constants";

export type UsersListParams = {
  enabled?: boolean;
  limit?: number;
  page: number;
  role?: "user" | "admin";
  search?: string;
  status?: "active" | "inactive" | "suspended";
  emailVerified?: boolean;
  sortBy?: UserSortField;
  sortOrder?: UserSortOrder;
};

export const usersKeys = {
  all: ["admin-users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (params: UsersListParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (userId: string) => [...usersKeys.details(), userId] as const,
};

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export function useUsersListQuery(params: UsersListParams) {
  const { enabled = true, limit = DEFAULT_PAGE_SIZE, ...queryParams } = params;

  return useQuery({
    enabled,
    queryKey: usersKeys.list({ ...queryParams, limit }),
    queryFn: async () => {
      try {
        const result = await client.get<{ 200: { items: UserDto[]; total: number; page: number; limit: number; totalPages: number } }>({
          url: "/api/v1/users",
          query: {
            limit,
            page: queryParams.page,
            ...(queryParams.search ? { search: queryParams.search } : {}),
            ...(queryParams.role ? { role: queryParams.role } : {}),
            ...(queryParams.emailVerified !== undefined ? { emailVerified: String(queryParams.emailVerified) } : {}),
            ...(queryParams.sortBy ? { sortBy: queryParams.sortBy } : {}),
            ...(queryParams.sortOrder ? { sortOrder: queryParams.sortOrder } : {}),
            ...(queryParams.status ? { status: queryParams.status } : {}),
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
        const message = (result.error as { message?: string } | undefined)?.message;
        throw Object.assign(new Error(message ?? "Update failed"), { status: result.response?.status });
      }
      return result.data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(usersKeys.detail(user.id), user);
      void queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
