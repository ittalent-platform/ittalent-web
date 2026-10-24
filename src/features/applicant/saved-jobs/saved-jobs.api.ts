import {
  deleteApiV1MeWishlistById,
  deleteApiV1MeWishlistJobsByJobId,
  deleteApiV1MeWishlistUnavailable,
  getApiV1MeWishlist,
  getApiV1MeWishlistJobsByJobId,
  postApiV1MeWishlist,
  postApiV1MeWishlistToggle,
} from "@/api/generated";
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
  const result = await getApiV1MeWishlist({
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
  const result = await getApiV1MeWishlistJobsByJobId({
    path: { jobId },
  });
  return unwrap(result, "Could not check job saved status.");
}

export async function saveJob(
  jobId: string,
): Promise<WishlistSaveResponse> {
  const result = await postApiV1MeWishlist({
    body: { jobId },
  });
  return unwrap(result, "Could not save job to wishlist.");
}

export async function toggleSaveJob(
  jobId: string,
): Promise<WishlistToggleResponse> {
  const result = await postApiV1MeWishlistToggle({
    body: { jobId },
  });
  return unwrap(result, "Could not toggle saved job status.");
}

export async function removeSavedJob(
  jobId: string,
): Promise<WishlistDeleteResponse> {
  const result = await deleteApiV1MeWishlistJobsByJobId({
    path: { jobId },
  });
  return unwrap(result, "Could not remove job from saved jobs.");
}

export async function removeSavedJobById(
  id: string,
): Promise<WishlistDeleteResponse> {
  const result = await deleteApiV1MeWishlistById({
    path: { id },
  });
  return unwrap(result, "Could not remove saved job.");
}

export async function clearUnavailableSavedJobs(): Promise<WishlistBulkDeleteResponse> {
  const result = await deleteApiV1MeWishlistUnavailable();
  return unwrap(result, "Could not clear unavailable jobs.");
}
