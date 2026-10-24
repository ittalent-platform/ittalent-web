import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  checkJobSaved,
  clearUnavailableSavedJobs,
  getSavedJobs,
  removeSavedJob,
  removeSavedJobById,
  saveJob,
  toggleSaveJob,
} from "./saved-jobs.api";
import { savedJobKeys } from "./saved-jobs.constants";
import type { SavedJobsQueryParams } from "./saved-jobs.types";

export function useSavedJobsQuery(
  params: SavedJobsQueryParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: savedJobKeys.list(params),
    queryFn: () => getSavedJobs(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useCheckSavedJobQuery(
  jobId?: string | null,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: savedJobKeys.check(jobId ?? ""),
    queryFn: () => checkJobSaved(jobId!),
    enabled: Boolean(jobId) && (options.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useSaveJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => saveJob(jobId),
    onSuccess: (data, jobId) => {
      queryClient.setQueryData(savedJobKeys.check(jobId), {
        isSaved: true,
        wishlistId: data.id ?? null,
      });
      queryClient.invalidateQueries({ queryKey: savedJobKeys.lists() });
    },
  });
}

export function useToggleSaveJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => toggleSaveJob(jobId),
    onSuccess: (data, jobId) => {
      queryClient.setQueryData(savedJobKeys.check(jobId), {
        isSaved: data.saved,
        wishlistId: data.id ?? null,
      });
      queryClient.invalidateQueries({ queryKey: savedJobKeys.lists() });
    },
  });
}

export function useRemoveSavedJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => removeSavedJob(jobId),
    onSuccess: (_data, jobId) => {
      queryClient.setQueryData(savedJobKeys.check(jobId), {
        isSaved: false,
        wishlistId: null,
      });
      queryClient.invalidateQueries({ queryKey: savedJobKeys.lists() });
    },
  });
}

export function useRemoveSavedJobByIdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: string | { id: string; jobId?: string }) => {
      const id = typeof variables === "string" ? variables : variables.id;
      return removeSavedJobById(id);
    },
    onSuccess: (_data, variables) => {
      const jobId = typeof variables === "object" ? variables.jobId : undefined;
      if (jobId) {
        queryClient.setQueryData(savedJobKeys.check(jobId), {
          isSaved: false,
          wishlistId: null,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: savedJobKeys.checks() });
      }
      queryClient.invalidateQueries({ queryKey: savedJobKeys.lists() });
    },
  });
}

export function useClearUnavailableMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearUnavailableSavedJobs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedJobKeys.checks() });
      queryClient.invalidateQueries({ queryKey: savedJobKeys.lists() });
    },
  });
}
