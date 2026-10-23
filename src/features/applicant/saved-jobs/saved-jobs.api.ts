import { client } from "@/api/client";
import { unwrap } from "@/api/request-error";
import type {
  SavedJobsListResponse,
  SavedJobsQueryParams,
  WishlistBulkDeleteResponse,
  WishlistCheckResponse,
  WishlistDeleteResponse,
  WishlistSaveResponse,
  WishlistToggleResponse,
} from "./saved-jobs.types";

export async function getSavedJobs(
  params: SavedJobsQueryParams = {},
): Promise<SavedJobsListResponse> {
  const result = await client.get<{ 200: SavedJobsListResponse }>({
    url: "/api/v1/me/wishlist",
    query: {
      ...(params.page ? { page: params.page } : {}),
      ...(params.limit ? { limit: params.limit } : {}),
      ...(params.q ? { q: params.q.trim() } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.location ? { location: params.location.trim() } : {}),
    },
  });
  return unwrap(result, "Could not load saved jobs.");
}

export async function checkJobSaved(
  jobId: string,
): Promise<WishlistCheckResponse> {
  const result = await client.get<{ 200: WishlistCheckResponse }>({
    url: `/api/v1/me/wishlist/jobs/${jobId}`,
  });
  return unwrap(result, "Could not check job saved status.");
}

export async function saveJob(
  jobId: string,
): Promise<WishlistSaveResponse> {
  const result = await client.post<{ 200: WishlistSaveResponse; 201: WishlistSaveResponse }>({
    url: "/api/v1/me/wishlist",
    body: { jobId },
  });
  return unwrap(result, "Could not save job to wishlist.");
}

export async function toggleSaveJob(
  jobId: string,
): Promise<WishlistToggleResponse> {
  const result = await client.post<{ 200: WishlistToggleResponse }>({
    url: "/api/v1/me/wishlist/toggle",
    body: { jobId },
  });
  return unwrap(result, "Could not toggle saved job status.");
}

export async function removeSavedJob(
  jobId: string,
): Promise<WishlistDeleteResponse> {
  const result = await client.delete<{ 200: WishlistDeleteResponse }>({
    url: `/api/v1/me/wishlist/jobs/${jobId}`,
  });
  return unwrap(result, "Could not remove job from saved jobs.");
}

export async function removeSavedJobById(
  id: string,
): Promise<WishlistDeleteResponse> {
  const result = await client.delete<{ 200: WishlistDeleteResponse }>({
    url: `/api/v1/me/wishlist/${id}`,
  });
  return unwrap(result, "Could not remove saved job.");
}

export async function clearUnavailableSavedJobs(): Promise<WishlistBulkDeleteResponse> {
  const result = await client.delete<{ 200: WishlistBulkDeleteResponse }>({
    url: "/api/v1/me/wishlist/unavailable",
  });
  return unwrap(result, "Could not clear unavailable jobs.");
}
