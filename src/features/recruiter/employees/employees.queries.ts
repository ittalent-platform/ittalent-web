import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/api/client";
import i18n from "@/i18n";
import { getUserById, getApiV1UsersByIdHistory } from "@/api/generated";
import type { UserDto, UserListResponse } from "@/api/generated/types.gen";

import type {
  CreateEmployeeRequest,
  EmployeesListParams,
  UpdateEmployeeRequest,
  UpdateEmployeeStatusRequest,
  UserHistoryResponse,
} from "./employees.types";
import { unwrap } from "@/api/request-error";

const JSON_HEADERS = { "Content-Type": "application/json" };

export const employeesKeys = {
  all: ["recruiter-employees"] as const,
  lists: () => [...employeesKeys.all, "list"] as const,
  list: (params: EmployeesListParams) =>
    [...employeesKeys.lists(), params] as const,
  details: () => [...employeesKeys.all, "detail"] as const,
  detail: (id: string) => [...employeesKeys.details(), id] as const,
  histories: () => [...employeesKeys.all, "history"] as const,
  history: (id: string) => [...employeesKeys.histories(), id] as const,
};

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
export const EMPLOYEE_HISTORY_PAGE_SIZE = 20;

export function useEmployeesListQuery(params: EmployeesListParams) {
  const { enabled = true, limit = DEFAULT_PAGE_SIZE, ...queryParams } = params;

  return useQuery({
    enabled,
    queryKey: employeesKeys.list({ ...queryParams, limit }),
    queryFn: async (): Promise<UserListResponse> => {
      const beSortBy =
        queryParams.sortBy === "full_name" ||
        (queryParams.sortBy as string) === "fullName"
          ? "name"
          : queryParams.sortBy &&
              ["createdAt", "id", "name", "username", "email"].includes(
                queryParams.sortBy,
              )
            ? (queryParams.sortBy as
                "createdAt" | "id" | "name" | "username" | "email")
            : undefined;

      const result = await client.get<{ 200: UserListResponse }>({
        url: "/api/v1/users",
        query: {
          limit,
          page: queryParams.page,
          ...(queryParams.search ? { search: queryParams.search } : {}),
          ...(queryParams.status && queryParams.status !== "all"
            ? {
                status:
                  queryParams.status === "inactive"
                    ? ["inactive", "invited"]
                    : queryParams.status === "suspended"
                      ? ["suspended", "blocked"]
                      : [queryParams.status],
              }
            : {}),
          ...(beSortBy ? { sortBy: beSortBy } : {}),
          ...(queryParams.sortOrder
            ? { sortOrder: queryParams.sortOrder }
            : {}),
        },
      });

      if (result.error) {
        throw Object.assign(result.error as object, {
          status: result.response?.status,
        });
      }

      return (
        result.data ?? {
          items: [] as UserDto[],
          total: 0,
          page: queryParams.page,
          limit,
          totalPages: 0,
        }
      );
    },
  });
}

export function useEmployeeDetailQuery(employeeId: string, enabled = true) {
  return useQuery({
    enabled: Boolean(employeeId) && enabled,
    queryKey: employeesKeys.detail(employeeId),
    queryFn: async (): Promise<UserDto> => {
      const result = await getUserById({
        client,
        path: { id: employeeId },
      });

      if (result.error) {
        throw Object.assign(result.error as object, {
          status: result.response?.status,
        });
      }

      if (!result.data) {
        throw new Error("Employee not found");
      }

      return result.data;
    },
  });
}

export function useEmployeeHistoryQuery(employeeId: string, enabled = true) {
  return useInfiniteQuery({
    enabled: Boolean(employeeId) && enabled,
    queryKey: employeesKeys.history(employeeId),
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<UserHistoryResponse> => unwrap(await getApiV1UsersByIdHistory({ client, path: { id: employeeId }, query: { page: pageParam, limit: EMPLOYEE_HISTORY_PAGE_SIZE } }), "Unable to load employee history"),
    getNextPageParam: (last) => last.page < last.totalPages ? last.page + 1 : undefined,
  });
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmployeeRequest): Promise<UserDto> => {
      const result = await client.post<{ 201: UserDto }>({
        url: "/api/v1/users",
        body: data,
        headers: JSON_HEADERS,
      });

      if (result.error) {
        const errorData = result.error as {
          message?: string;
          errors?: Record<string, string[]>;
        };
        const message =
          errorData.message ?? i18n.t("recruiterEmployees.invite.failed");
        throw Object.assign(new Error(message), errorData, {
          status: result.response?.status,
        });
      }

      if (!result.data) {
        throw new Error("No data returned from creation");
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeesKeys.all });
    },
  });
}

export function useUpdateEmployeeMutation(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEmployeeRequest): Promise<UserDto> => {
      const result = await client.patch<{ 200: UserDto }>({
        url: `/api/v1/users/${employeeId}`,
        body: data,
        headers: JSON_HEADERS,
      });

      if (result.error) {
        const errorData = result.error as { message?: string };
        throw Object.assign(
          new Error(errorData.message ?? i18n.t("recruiterEmployees.edit.failed")),
          errorData,
          {
            status: result.response?.status,
          },
        );
      }

      if (!result.data) {
        throw new Error("No data returned from update");
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: employeesKeys.detail(employeeId),
      });
      void queryClient.invalidateQueries({ queryKey: employeesKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: employeesKeys.history(employeeId),
      });
    },
  });
}

export function useUpdateEmployeeStatusMutation(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEmployeeStatusRequest): Promise<UserDto> => {
      const result = await client.patch<{ 200: UserDto }>({
        url: `/api/v1/users/${employeeId}/status`,
        body: data,
        headers: JSON_HEADERS,
      });

      if (result.error) {
        const errorData = result.error as { message?: string };
        throw Object.assign(
          new Error(errorData.message ?? i18n.t("recruiterEmployees.statusDialog.failed")),
          errorData,
          {
            status: result.response?.status,
          },
        );
      }

      if (!result.data) {
        throw new Error("No data returned from status update");
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: employeesKeys.detail(employeeId),
      });
      void queryClient.invalidateQueries({ queryKey: employeesKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: employeesKeys.history(employeeId),
      });
    },
  });
}
