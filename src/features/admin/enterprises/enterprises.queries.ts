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
  EnterpriseListResponse,
  UpdateEnterpriseDto,
  UpdateEnterpriseStatusDto,
} from "@/api/generated/types.gen";
import { HTTP_NOT_FOUND } from "@/api/http-status";
import { unwrap } from "@/api/request-error";

// email, phone, createdAt and creatorAccountId are part of the list contract now.
export type EnterpriseSummaryDto = EnterpriseListResponse["items"][number];

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

/** Fallback message when a create or update fails without a server message. */
export const SAVE_FAILED = "An error occurred while saving the enterprise profile.";

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export function useEnterprisesListQuery(params: EnterpriseListParams) {
  const { enabled = true, limit = DEFAULT_PAGE_SIZE, ...queryParams } = params;

  return useQuery({
    enabled,
    queryKey: enterprisesKeys.list({ ...queryParams, limit }),
    queryFn: async () => {
      const empty = { items: [] as EnterpriseSummaryDto[], total: 0, page: 1, limit, totalPages: 0 };
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
      // A backend without the list endpoint yet (404) shows an empty list instead of an error.
      if (result.response?.status === HTTP_NOT_FOUND) return empty;
      return unwrap(result, "Unable to load enterprises") ?? empty;
    },
  });
}

export function useEnterpriseDetailQuery(enterpriseId: string | undefined) {
  return useQuery({
    enabled: Boolean(enterpriseId),
    queryKey: enterprisesKeys.detail(enterpriseId ?? ""),
    queryFn: async () => {
      return unwrap(await getApiV1EnterprisesByEnterpriseId({
        path: { enterpriseId: enterpriseId as string },
      }), "Enterprise not found");
    },
  });
}

export function useCreateEnterpriseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateEnterpriseDto) => {
      return unwrap(await postApiV1Enterprises({
        body: payload,
      }), SAVE_FAILED);
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
      return unwrap(await patchApiV1EnterprisesByEnterpriseId({
        path: { enterpriseId },
        body: payload,
      }), SAVE_FAILED);
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
      return unwrap(await patchApiV1EnterprisesByEnterpriseIdStatus({
        path: { enterpriseId },
        body: payload,
      }), "Failed to update enterprise status");
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
      return unwrap(await deleteApiV1EnterprisesByEnterpriseId({
        path: { enterpriseId },
      }), "Failed to delete enterprise");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterprisesKeys.lists() });
    },
  });
}
