import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/api/client";
import {
  createEmployee,
  getApiV1UsersById,
  getUserHistory,
  patchApiV1UsersById,
  updateUserStatus,
} from "@/api/generated";
import type {
  CreateEmployeeRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UserDto,
  UserHistoryResponse,
  UserListResponse,
} from "@/api/generated/types.gen";

import type { EmployeesListParams } from "./employees.types";

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
            ? { status: queryParams.status }
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
      const result = await getApiV1UsersById({
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
  return useQuery({
    enabled: Boolean(employeeId) && enabled,
    queryKey: employeesKeys.history(employeeId),
    queryFn: async (): Promise<UserHistoryResponse> => {
      const result = await getUserHistory({
        client,
        path: { id: employeeId },
      });

      if (result.error) {
        throw Object.assign(result.error as object, {
          status: result.response?.status,
        });
      }

      return (
        result.data ?? {
          items: [],
        }
      );
    },
  });
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmployeeRequest): Promise<UserDto> => {
      const result = await createEmployee({
        client,
        body: data,
      });

      if (result.error) {
        const errorData = result.error as {
          message?: string;
          errors?: Record<string, string[]>;
        };
        const message =
          errorData.message ?? "Failed to create employee account";
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
    mutationFn: async (data: UpdateUserRequest): Promise<UserDto> => {
      const result = await patchApiV1UsersById({
        client,
        path: { id: employeeId },
        body: data,
      });

      if (result.error) {
        const errorData = result.error as { message?: string };
        throw Object.assign(
          new Error(errorData.message ?? "Failed to update employee"),
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
    mutationFn: async (data: UpdateUserStatusRequest): Promise<UserDto> => {
      const result = await updateUserStatus({
        client,
        path: { id: employeeId },
        body: data,
      });

      if (result.error) {
        const errorData = result.error as { message?: string };
        throw Object.assign(
          new Error(errorData.message ?? "Failed to update employee status"),
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
