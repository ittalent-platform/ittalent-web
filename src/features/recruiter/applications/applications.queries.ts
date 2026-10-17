import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getApiV1RecruiterApplications,
  getApiV1RecruiterApplicationsById,
  getApiV1RecruiterApplicationsByIdCompanyHistory,
  getApiV1RecruiterApplicationsByIdCv,
  getApiV1RecruiterApplicationsByIdNotes,
  patchApiV1RecruiterApplicationsByIdStatus,
  postApiV1RecruiterApplicationsByIdNotes,
} from "@/api/generated";
import type {
  CreateRecruiterNoteBody,
  GetApiV1RecruiterApplicationsData,
  UpdateRecruiterApplicationStatusBody,
} from "@/api/generated/types.gen";
import { unwrap } from "@/api/request-error";

export type RecruiterApplicationsListParams = NonNullable<GetApiV1RecruiterApplicationsData["query"]>;

export const recruiterApplicationKeys = {
  all: ["recruiter", "applications"] as const,
  lists: () => [...recruiterApplicationKeys.all, "list"] as const,
  list: (params: RecruiterApplicationsListParams) =>
    [...recruiterApplicationKeys.lists(), params] as const,
  details: () => [...recruiterApplicationKeys.all, "detail"] as const,
  detail: (id: string) => [...recruiterApplicationKeys.details(), id] as const,
  cv: (id: string) => [...recruiterApplicationKeys.detail(id), "cv"] as const,
  notes: (id: string) => [...recruiterApplicationKeys.detail(id), "notes"] as const,
  companyHistory: (id: string) =>
    [...recruiterApplicationKeys.detail(id), "company-history"] as const,
};

/**
 * Fetch paginated candidate applications for recruiter owned jobs.
 * Skips execution when filters are invalid (`enabled: false`).
 */
export function useRecruiterApplications(
  params: RecruiterApplicationsListParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: recruiterApplicationKeys.list(params),
    queryFn: async () => unwrap(await getApiV1RecruiterApplications({ query: params })),
    enabled: options.enabled ?? true,
  });
}

/** Fetch full detail of an application owned by the recruiter's company. */
export function useRecruiterApplication(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: recruiterApplicationKeys.detail(id),
    queryFn: async () => unwrap(await getApiV1RecruiterApplicationsById({ path: { id } })),
    enabled: (options.enabled ?? true) && Boolean(id),
  });
}

/** Fetch short-lived CV preview / download metadata. */
export function useRecruiterApplicationCv(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: recruiterApplicationKeys.cv(id),
    queryFn: async () => unwrap(await getApiV1RecruiterApplicationsByIdCv({ path: { id } })),
    enabled: (options.enabled ?? true) && Boolean(id),
  });
}

/** Fetch recruiter internal notes list for an application. */
export function useRecruiterApplicationNotes(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: recruiterApplicationKeys.notes(id),
    queryFn: async () => unwrap(await getApiV1RecruiterApplicationsByIdNotes({ path: { id } })),
    enabled: (options.enabled ?? true) && Boolean(id),
  });
}

/** Fetch candidate company-wide application history across all enterprise job postings (UC-S2-AA-07). */
export function useRecruiterCompanyHistory(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: recruiterApplicationKeys.companyHistory(id),
    queryFn: async () =>
      unwrap(await getApiV1RecruiterApplicationsByIdCompanyHistory({ path: { id } })),
    enabled: (options.enabled ?? true) && Boolean(id),
  });
}

/** Append an internal note to an application. */
export function useCreateRecruiterNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateRecruiterNoteBody) => {
      return unwrap(
        await postApiV1RecruiterApplicationsByIdNotes({
          path: { id },
          body,
        }),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recruiterApplicationKeys.notes(id) }),
        queryClient.invalidateQueries({ queryKey: recruiterApplicationKeys.detail(id) }),
      ]);
    },
  });
}

/** Update application recruitment status (UC-S2-AA-03, BR-17, BR-18). */
export function useUpdateRecruiterApplicationStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateRecruiterApplicationStatusBody) => {
      return unwrap(
        await patchApiV1RecruiterApplicationsByIdStatus({
          path: { id },
          body,
        }),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recruiterApplicationKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: recruiterApplicationKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: recruiterApplicationKeys.companyHistory(id) }),
      ]);
    },
  });
}
