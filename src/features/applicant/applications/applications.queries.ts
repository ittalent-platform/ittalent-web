import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiV1MeApplications, getApiV1MeApplicationsById, getApiV1MeApplicationsByIdHistory, patchApiV1MeApplicationsByIdWithdraw } from "@/api/generated";
import type { GetApiV1MeApplicationsData } from "@/api/generated/types.gen";
import { HISTORY_PAGE_SIZE } from "./applications.constants";
import { unwrap } from "@/api/request-error";

export type ListParams = NonNullable<GetApiV1MeApplicationsData["query"]>;

export const applicationKeys = {
  all: ["my-applications"] as const,
  list: (params: ListParams) => [...applicationKeys.all, "list", params] as const,
  detail: (id: string) => [...applicationKeys.all, "detail", id] as const,
  history: (id: string) => [...applicationKeys.all, "history", id] as const,
};



/** `enabled: false` skips the request while the filters are invalid (nothing is fetched for an invalid query). */
export function useApplications(params: ListParams, options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: applicationKeys.list(params), queryFn: async () => unwrap(await getApiV1MeApplications({ query: params })), enabled: options.enabled ?? true });
}

export function useApplication(id: string) {
  return useQuery({ queryKey: applicationKeys.detail(id), queryFn: async () => unwrap(await getApiV1MeApplicationsById({ path: { id } })), enabled: Boolean(id) });
}

// History is an append-only list capped by the API page size; one request covers the timeline and its "View all" dialog.
export function useApplicationHistory(id: string) {
  return useInfiniteQuery({
    queryKey: applicationKeys.history(id),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => unwrap(await getApiV1MeApplicationsByIdHistory({ path: { id }, query: { page: pageParam, limit: HISTORY_PAGE_SIZE } })),
    getNextPageParam: (last) => last.page < last.totalPages ? last.page + 1 : undefined,
    enabled: Boolean(id),
  });
}

export type WithdrawInput = { id: string; reason?: string; expectedVersion?: number };

/**
 * Withdraws one or many applications. The list DTO does not carry a version, so callers without one
 * (board / row menu) get it from the detail endpoint first; the server still enforces the version check.
 */
export function useWithdrawApplications() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: WithdrawInput[]) => {
      const results = await Promise.allSettled(
        inputs.map(async ({ id, reason, expectedVersion }) => {
          const version = expectedVersion ?? unwrap(await getApiV1MeApplicationsById({ path: { id } })).version;
          return unwrap(await patchApiV1MeApplicationsByIdWithdraw({ path: { id }, body: { expectedVersion: version, ...(reason ? { reason } : {}) } }));
        }),
      );
      const failed = results.flatMap((result, index) => (result.status === "rejected" ? [{ id: inputs[index]!.id, error: result.reason as unknown }] : []));
      return { succeeded: results.length - failed.length, failed };
    },
    onSettled: async () => { await client.invalidateQueries({ queryKey: applicationKeys.all }); },
  });
}
