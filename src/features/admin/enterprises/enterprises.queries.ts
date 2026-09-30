import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteApiV1EnterprisesByEnterpriseId,
  getApiV1Enterprises,
  getApiV1EnterprisesByEnterpriseId,
  patchApiV1EnterprisesByEnterpriseId,
  patchApiV1EnterprisesByEnterpriseIdStatus,
  postApiV1Enterprises,
} from "@/api/generated";
import type {
  CreateEnterpriseDto,
  EnterpriseDetailDto,
  EnterpriseListResponse,
  UpdateEnterpriseDto,
  UpdateEnterpriseStatusDto,
} from "@/api/generated/types.gen";

export type EnterpriseSummaryDto = EnterpriseListResponse["items"][number] & {
  email?: string;
  phone?: string;
  createdAt?: string;
  creatorAccountId?: string;
};

export type EnterpriseListParams = {
  enabled?: boolean;
  limit?: number;
  page: number;
  keyword?: string;
  industry?: string;
  location?: string;
  company_size?: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";
  status?: "pending" | "active" | "suspended" | "rejected" | "inactive";
};

export const enterprisesKeys = {
  all: ["admin-enterprises"] as const,
  lists: () => [...enterprisesKeys.all, "list"] as const,
  list: (params: EnterpriseListParams) => [...enterprisesKeys.lists(), params] as const,
  details: () => [...enterprisesKeys.all, "detail"] as const,
  detail: (enterpriseId: string) => [...enterprisesKeys.details(), enterpriseId] as const,
};

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export function useEnterprisesListQuery(params: EnterpriseListParams) {
  const { enabled = true, limit = DEFAULT_PAGE_SIZE, ...queryParams } = params;

  return useQuery({
    enabled,
    queryKey: enterprisesKeys.list({ ...queryParams, limit }),
    queryFn: async () => {
      try {
        const result = await getApiV1Enterprises({
          query: {
            limit,
            page: queryParams.page,
            ...(queryParams.keyword ? { keyword: queryParams.keyword } : {}),
            ...(queryParams.industry ? { industry: queryParams.industry } : {}),
            ...(queryParams.location ? { location: queryParams.location } : {}),
            ...(queryParams.company_size ? { company_size: queryParams.company_size } : {}),
            ...(queryParams.status ? { status: queryParams.status } : {}),
          },
        });

        if (result.error) {
          throw Object.assign(result.error as object, { status: result.response?.status });
        }

        return (
          result.data ?? {
            items: [] as EnterpriseSummaryDto[],
            total: 0,
            page: 1,
            limit,
            totalPages: 0,
          }
        );
      } catch (err) {
        const error = err as { status?: number };
        if (error.status === 404) {
          return {
            items: [] as EnterpriseSummaryDto[],
            total: 0,
            page: 1,
            limit,
            totalPages: 0,
          };
        }
        throw err;
      }
    },
  });
}

export function useEnterpriseDetailQuery(enterpriseId: string | undefined) {
  return useQuery({
    enabled: Boolean(enterpriseId),
    queryKey: enterprisesKeys.detail(enterpriseId ?? ""),
    queryFn: async () => {
      const result = await getApiV1EnterprisesByEnterpriseId({
        path: { enterpriseId: enterpriseId as string },
      });

      if (result.error || !result.data) {
        throw Object.assign((result.error as object) ?? new Error("Enterprise not found"), {
          status: result.response?.status,
        });
      }

      return result.data as EnterpriseDetailDto;
    },
  });
}

export function useCreateEnterpriseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateEnterpriseDto) => {
      const result = await postApiV1Enterprises({
        body: payload,
      });

      if (result.error || !result.data) {
        throw Object.assign(
          (result.error as object) ?? new Error("Failed to create enterprise"),
          { status: result.response?.status, data: result.error },
        );
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterprisesKeys.lists() });
    },
  });
}

export function useUpdateEnterpriseMutation(enterpriseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateEnterpriseDto) => {
      const result = await patchApiV1EnterprisesByEnterpriseId({
        path: { enterpriseId },
        body: payload,
      });

      if (result.error || !result.data) {
        throw Object.assign(
          (result.error as object) ?? new Error("Failed to update enterprise"),
          { status: result.response?.status, data: result.error },
        );
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterprisesKeys.detail(enterpriseId) });
      queryClient.invalidateQueries({ queryKey: enterprisesKeys.lists() });
    },
  });
}

export function useUpdateEnterpriseStatusMutation(enterpriseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateEnterpriseStatusDto) => {
      const result = await patchApiV1EnterprisesByEnterpriseIdStatus({
        path: { enterpriseId },
        body: payload,
      });

      if (result.error || !result.data) {
        throw Object.assign(
          (result.error as object) ?? new Error("Failed to update enterprise status"),
          { status: result.response?.status, data: result.error },
        );
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterprisesKeys.detail(enterpriseId) });
      queryClient.invalidateQueries({ queryKey: enterprisesKeys.lists() });
    },
  });
}

export function useDeleteEnterpriseMutation(enterpriseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await deleteApiV1EnterprisesByEnterpriseId({
        path: { enterpriseId },
      });

      if (result.error) {
        throw Object.assign(
          (result.error as object) ?? new Error("Failed to delete enterprise"),
          { status: result.response?.status, data: result.error },
        );
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterprisesKeys.lists() });
    },
  });
}
