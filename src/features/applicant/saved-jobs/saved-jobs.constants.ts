import type { SavedJobsQueryParams } from "./saved-jobs.types";

export const SAVED_JOBS_PAGE_SIZE = 20;
export const SAVED_JOBS_KEYWORD_MAX_LENGTH = 100;

export const SAVED_JOBS_STATUS_FILTERS = ["all", "available", "unavailable"] as const;
export type SavedJobsStatusFilter = (typeof SAVED_JOBS_STATUS_FILTERS)[number];

export const savedJobKeys = {
  all: ["saved-jobs"] as const,
  lists: () => [...savedJobKeys.all, "list"] as const,
  list: (params: SavedJobsQueryParams) => [...savedJobKeys.lists(), params] as const,
  checks: () => [...savedJobKeys.all, "check"] as const,
  check: (jobId: string) => [...savedJobKeys.checks(), jobId] as const,
};
