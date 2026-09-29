import { client } from "@/api/client";
import { formDataBodySerializer } from "@/api/generated/core/bodySerializer.gen";

export const jobPostingStatuses = ["draft", "published", "archived"] as const;
export type JobPostingStatus = (typeof jobPostingStatuses)[number];

export type JobPosting = {
  enterpriseId?: string;
  id: string;
  postedByUserId?: string;
  title: string;
  slug: string;
  location?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  level?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  openings?: number;
  status: JobPostingStatus;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type JobPostingPayload = {
  title: string;
  location?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  level?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  openings?: number;
  status?: JobPostingStatus;
  expires_at?: string;
};

export type JobPostingListParams = {
  employment_type?: string;
  level?: string;
  limit: number;
  location?: string;
  page: number;
  search?: string;
  sort_by?: "created_at" | "title" | "expires_at";
  sort_order?: "asc" | "desc";
  status?: JobPostingStatus;
};

export type PaginatedResponse<T> = {
  items: T[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type ApiErrorBody = { message?: string };

function unwrap<T>(result: {
  data?: T;
  error?: unknown;
  response?: Response;
}): T {
  if (!result.error && result.data !== undefined) return result.data;
  throw Object.assign(
    result.error && typeof result.error === "object"
      ? result.error
      : new Error(
          typeof result.error === "string" ? result.error : "Request failed",
        ),
    {
      status: result.response?.status,
    },
  );
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Unable to complete this request.",
) {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof (error as ApiErrorBody).message === "string"
  ) {
    return (error as ApiErrorBody).message as string;
  }
  return fallback;
}

export async function listAdminJobPostings(params: JobPostingListParams) {
  return unwrap(
    await client.get<{ 200: PaginatedResponse<JobPosting> }, ApiErrorBody>({
      url: "/api/v1/admin/job-postings",
      query: params,
    }),
  );
}

export async function listRecruiterJobPostings(params: JobPostingListParams) {
  return unwrap(
    await client.get<{ 200: PaginatedResponse<JobPosting> }, ApiErrorBody>({
      url: "/api/v1/recruiter/job-postings",
      query: params,
    }),
  );
}

export async function listPublicJobPostings(params: JobPostingListParams) {
  return unwrap(
    await client.get<{ 200: PaginatedResponse<JobPosting> }, ApiErrorBody>({
      url: "/api/v1/job-postings",
      query: params,
    }),
  );
}

export async function getJobPostingById(id: string) {
  return unwrap(
    await client.get<{ 200: JobPosting }, ApiErrorBody>({
      url: "/api/v1/job-postings/{id}",
      path: { id },
    }),
  );
}

export async function createJobPosting(payload: JobPostingPayload) {
  return unwrap(
    await client.post<{ 201: JobPosting }, ApiErrorBody>({
      url: "/api/v1/job-postings",
      body: payload,
    }),
  );
}

export async function updateJobPosting(
  id: string,
  payload: Partial<JobPostingPayload>,
) {
  return unwrap(
    await client.patch<{ 200: JobPosting }, ApiErrorBody>({
      url: "/api/v1/job-postings/{id}",
      path: { id },
      body: payload,
    }),
  );
}

export async function deleteJobPosting(id: string) {
  const result = await client.delete<{ 204: undefined }, ApiErrorBody>({
    url: "/api/v1/job-postings/{id}",
    path: { id },
  });
  const response = result as unknown as {
    error?: unknown;
    response?: Response;
  };
  if (response.error)
    throw Object.assign(
      typeof response.error === "object"
        ? response.error
        : new Error(String(response.error)),
      { status: response.response?.status },
    );
}

export type DocumentType = "cv" | "cover_letter";
export type CandidateDocument = {
  id: string;
  ownerId: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export async function listDocuments(params: {
  limit: number;
  page: number;
  sort_order?: "asc" | "desc";
  type?: DocumentType;
}) {
  return unwrap(
    await client.get<
      { 200: PaginatedResponse<CandidateDocument> },
      ApiErrorBody
    >({ url: "/api/v1/documents", query: params }),
  );
}

export async function uploadDocument(type: DocumentType, file: File) {
  return client.post<CandidateDocument, ApiErrorBody, true, "data">({
    url: "/api/v1/documents",
    body: { file, type },
    bodySerializer: formDataBodySerializer.bodySerializer,
    headers: { "Content-Type": null },
    responseStyle: "data",
    throwOnError: true,
  });
}
