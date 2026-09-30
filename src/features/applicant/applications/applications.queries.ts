import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiV1MeApplications, getApiV1MeApplicationsById, getApiV1MeApplicationsByIdHistory, patchApiV1MeApplicationsByIdWithdraw } from "@/api/generated";
import type { GetApiV1MeApplicationsData } from "@/api/generated/types.gen";
import { HISTORY_PAGE_SIZE } from "./applications.constants";

export type ListParams = NonNullable<GetApiV1MeApplicationsData["query"]>;
export type ApplicationRequestError = Error & { status?: number };

export const applicationKeys = {
  all: ["my-applications"] as const,
  list: (params: ListParams) => [...applicationKeys.all, "list", params] as const,
  detail: (id: string) => [...applicationKeys.all, "detail", id] as const,
  history: (id: string) => [...applicationKeys.all, "history", id] as const,
};

const REQUEST_FAILED = "APPLICATION_REQUEST_FAILED";

function unwrap<T>(result: { data?: T; error?: unknown; response?: Response }): T {
  if (result.error || !result.data) {
    const error: ApplicationRequestError = new Error(REQUEST_FAILED);
    error.status = result.response?.status;
    throw error;
  }
  return result.data;
}

export function requestStatus(error: unknown): number | undefined {
  return (error as ApplicationRequestError | null)?.status;
}

/** `enabled: false` skips the request while the filters are invalid (nothing is fetched for an invalid query). */
export function useApplications(params: ListParams, options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: applicationKeys.list(params), queryFn: async () => unwrap(await getApiV1MeApplications({ query: params })), enabled: options.enabled ?? true });
}

export function useApplication(id: string) {
  return useQuery({ queryKey: applicationKeys.detail(id), queryFn: async () => unwrap(await getApiV1MeApplicationsById({ path: { id } })), enabled: Boolean(id) });
}

// History is an append-only list capped by the API page size; one request covers the timeline and its "View all" dialog.
export function useApplicationHistory(id: string) {
  return useQuery({ queryKey: applicationKeys.history(id), queryFn: async () => unwrap(await getApiV1MeApplicationsByIdHistory({ path: { id }, query: { page: 1, limit: HISTORY_PAGE_SIZE } })), enabled: Boolean(id) });
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
