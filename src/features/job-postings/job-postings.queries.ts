import { useQuery } from "@tanstack/react-query";

import {
  deleteApiV1JobPostingsById,
  getApiV1AdminJobPostings,
  getApiV1JobPostings,
  getApiV1JobPostingsById,
  getApiV1RecruiterJobPostings,
  patchApiV1JobPostingsById,
  postApiV1JobPostings,
} from "@/api/generated";
import { requestError } from "@/api/request-error";
import type {
  CreateJobPostingRequest,
  GetApiV1JobPostingsData,
  JobPosting,
  PaginatedJobPostings,
  UpdateJobPostingRequest,
} from "@/api/generated/types.gen";

export type JobPostingListParams = NonNullable<
  GetApiV1JobPostingsData["query"]
>;

export const jobPostingKeys = {
  detail: (id: string) => ["job-postings", "detail", id] as const,
  root: (actor: "admin" | "recruiter") => ["job-postings", actor] as const,
  list: (actor: "admin" | "recruiter", params: JobPostingListParams) =>
    [...jobPostingKeys.root(actor), params] as const,
  public: (params: JobPostingListParams) =>
    ["job-postings", "public", params] as const,
};

function unwrap<T>(
  result: { data?: T; error?: unknown; response?: Response },
  fallback: string,
): T {
  if (!result.error && result.data !== undefined) return result.data;
  throw requestError(result, fallback);
}

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
