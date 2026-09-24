import { useQuery } from "@tanstack/react-query";
import { getApiV1Users, getApiV1UsersById } from "@/api/generated";
import type { UserDto } from "@/api/generated/types.gen";

export type UsersListParams = {
  enabled?: boolean;
  limit?: number;
  page: number;
  role?: "user" | "admin";
  search?: string;
  status?: "active" | "inactive" | "suspended";
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
        const result = await getApiV1Users({
          query: {
            limit,
            page: queryParams.page,
            ...(queryParams.search ? { search: queryParams.search } : {}),
            ...(queryParams.role ? { role: queryParams.role } : {}),
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
