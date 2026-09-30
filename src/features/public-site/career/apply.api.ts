import { client } from "@/api/client";
import { postJson } from "@/api/request";

export type ApplicantDocumentType = "cv" | "cover_letter";

export type ApplicantDocument = {
  id: string;
  fileName: string;
  type: ApplicantDocumentType;
};

type DocumentListResponse = { items: ApplicantDocument[] };

export type ApplyToJobRequest = {
  jobPostingId: string;
  cvId: string;
  coverLetterId?: string;
  message?: string;
};

export type ApplicationDto = {
  id: string;
  jobPostingId: string;
  status: string;
  cvId: string;
  coverLetterId: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
};

// The backend caps page size at 100, which is plenty for one applicant's CVs.
const DOCUMENT_LIST_LIMIT = 100;

/** Documents the signed-in user has uploaded, filtered by type. */
export async function fetchMyDocuments(
  type: ApplicantDocumentType,
): Promise<ApplicantDocument[]> {
  const result = await client.get<
    { 200: DocumentListResponse },
    { "*": unknown }
  >({
    query: { limit: DOCUMENT_LIST_LIMIT, type },
    url: "/api/v1/documents",
  });

  if (result.error || !result.data) {
    throw Object.assign(
      result.error && typeof result.error === "object" ? result.error : {},
      {
        status: result.response?.status,
      },
    );
  }

  return (result.data as DocumentListResponse).items;
}

/** Submit (or re-submit after Withdrawn/Rejected) an application. The backend emails a confirmation on success. */
export function applyToJob(body: ApplyToJobRequest): Promise<ApplicationDto> {
  return postJson<ApplicationDto>("/api/v1/applications", body);
}

/** The signed-in applicant's application for one job (any status), or null when they have not applied. */
export async function fetchMyApplication(
  jobPostingId: string,
): Promise<ApplicationDto | null> {
  const result = await client.get<
    { 200: { item: ApplicationDto | null } },
    { "*": unknown }
  >({
    query: { jobPostingId },
    url: "/api/v1/applications/mine",
  });

  if (result.error || !result.data) {
    throw Object.assign(
      result.error && typeof result.error === "object" ? result.error : {},
      {
        status: result.response?.status,
      },
    );
  }

  return (result.data as { item: ApplicationDto | null }).item;
}
