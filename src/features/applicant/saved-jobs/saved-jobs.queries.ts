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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savedJobKeys.all });
    },
  });
}

export function useToggleSaveJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => toggleSaveJob(jobId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savedJobKeys.all });
    },
  });
}

export function useRemoveSavedJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => removeSavedJob(jobId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savedJobKeys.all });
    },
  });
}

export function useRemoveSavedJobByIdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeSavedJobById(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savedJobKeys.all });
    },
  });
}

export function useClearUnavailableMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearUnavailableSavedJobs(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savedJobKeys.all });
    },
  });
}
