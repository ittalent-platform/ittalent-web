import { useQuery } from "@tanstack/react-query";

import {
  deleteApiV1JobPostingsById,
  getApiV1AdminJobPostings,
  getApiV1JobPostings,
  getApiV1JobPostingsById,
  getApiV1JobPostingsByIdHistory,
  getApiV1RecruiterJobPostings,
  patchApiV1JobPostingsById,
  patchApiV1JobPostingsByIdArchive,
  patchApiV1JobPostingsByIdClose,
  patchApiV1JobPostingsByIdReopen,
  patchApiV1JobPostingsByIdRestore,
  postApiV1JobPostings,
} from "@/api/generated";
import { requestError, unwrap } from "@/api/request-error";
import type {
  CreateJobPostingRequest,
  GetApiV1JobPostingsData,
  JobPosting,
  JobPostingHistory,
  PaginatedJobPostings,
  UpdateJobPostingRequest,
} from "@/api/generated/types.gen";

import { JOB_HISTORY_PAGE_SIZE } from "./job-postings.constants";

export type JobPostingListParams = NonNullable<
  GetApiV1JobPostingsData["query"]
>;

export const jobPostingKeys = {
  detail: (id: string) => ["job-postings", "detail", id] as const,
  history: (id: string) => ["job-postings", "history", id] as const,
  root: (actor: "admin" | "recruiter") => ["job-postings", actor] as const,
  list: (actor: "admin" | "recruiter", params: JobPostingListParams) =>
    [...jobPostingKeys.root(actor), params] as const,
  public: (params: JobPostingListParams) =>
    ["job-postings", "public", params] as const,
};

async function listAdmin(
  params: JobPostingListParams,
): Promise<PaginatedJobPostings> {
  return unwrap(
    await getApiV1AdminJobPostings({ query: params }),
    "Could not load job postings.",
  );
}

async function listRecruiter(
  params: JobPostingListParams,
): Promise<PaginatedJobPostings> {
  return unwrap(
    await getApiV1RecruiterJobPostings({ query: params }),
    "Could not load job postings.",
  );
}

export function useJobPostingList(
  actor: "admin" | "recruiter",
  params: JobPostingListParams,
) {
  return useQuery({
    queryKey: jobPostingKeys.list(actor, params),
    queryFn: () =>
      actor === "admin" ? listAdmin(params) : listRecruiter(params),
  });
}

export function usePublicJobPostings(params: JobPostingListParams) {
  return useQuery({
    queryKey: jobPostingKeys.public(params),
    queryFn: async () =>
      unwrap(
        await getApiV1JobPostings({ query: params }),
        "Could not load jobs.",
      ),
  });
}

export function useJobPosting(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: jobPostingKeys.detail(id ?? ""),
    queryFn: async (): Promise<JobPosting> =>
      unwrap(
        await getApiV1JobPostingsById({ path: { id: id ?? "" } }),
        "Job posting not found.",
      ),
  });
}

export function useJobPostingHistory(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: jobPostingKeys.history(id ?? ""),
    queryFn: async (): Promise<JobPostingHistory> =>
      unwrap(
        await getApiV1JobPostingsByIdHistory({
          path: { id: id ?? "" },
          query: { page: 1, limit: JOB_HISTORY_PAGE_SIZE },
        }),
        "Could not load job posting history.",
      ),
  });
}

export async function createJobPosting(
  body: CreateJobPostingRequest,
): Promise<JobPosting> {
  return unwrap(
    await postApiV1JobPostings({ body }),
    "Could not save job posting.",
  );
}

export async function updateJobPosting(
  id: string,
  body: UpdateJobPostingRequest,
): Promise<JobPosting> {
  return unwrap(
    await patchApiV1JobPostingsById({ path: { id }, body }),
    "Could not save job posting.",
  );
}

export async function deleteJobPosting(id: string): Promise<void> {
  const result = await deleteApiV1JobPostingsById({ path: { id } });
  if (result.error) throw requestError(result, "Could not delete job posting.");
}

export type JobPostingTransition = "archive" | "close" | "reopen" | "restore";

export async function transitionJobPosting(
  id: string,
  transition: JobPostingTransition,
): Promise<JobPosting> {
  const options = { path: { id } };
  const result =
    transition === "close"
      ? await patchApiV1JobPostingsByIdClose(options)
      : transition === "reopen"
        ? await patchApiV1JobPostingsByIdReopen(options)
        : transition === "archive"
          ? await patchApiV1JobPostingsByIdArchive(options)
          : await patchApiV1JobPostingsByIdRestore(options);
  return unwrap(result, "Could not change job posting status.");
}

export function moveJobPostingToDraft(id: string): Promise<JobPosting> {
  return updateJobPosting(id, { publication_status: "draft" });
}

export function publishJobPosting(id: string): Promise<JobPosting> {
  return updateJobPosting(id, { publication_status: "published" });
}
