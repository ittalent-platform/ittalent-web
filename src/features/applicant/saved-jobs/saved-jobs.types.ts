import type {
  AddWishlistRequest,
  PaginatedWishlistResponse,
  WishlistBulkDeleteResponse,
  WishlistCheckResponse,
  WishlistDeleteResponse,
  WishlistQuery,
  WishlistSaveResponse,
  WishlistToggleResponse,
} from "@/api/generated/types.gen";

export type WishlistAvailability = "available" | "unavailable";

export type SavedJobItem = PaginatedWishlistResponse["items"][number];
export type SavedJobEnterprise = NonNullable<SavedJobItem["enterprise"]>;

export type SavedJobsListResponse = PaginatedWishlistResponse;
export type SavedJobsQueryParams = WishlistQuery;

export type {
  AddWishlistRequest,
  PaginatedWishlistResponse,
  WishlistBulkDeleteResponse,
  WishlistCheckResponse,
  WishlistDeleteResponse,
  WishlistQuery,
  WishlistSaveResponse,
  WishlistToggleResponse,
};
