export type WishlistAvailability = "available" | "unavailable";

export type SavedJobEnterprise = {
  id: string;
  name: string;
  logoUrl?: string | null;
};

export type SavedJobItem = {
  id: string;
  jobId: string;
  savedAt: string;
  availability: WishlistAvailability;
  isClosingSoon?: boolean;
  title: string | null;
  slug: string | null;
  enterprise: SavedJobEnterprise | null;
  location: string | null;
  employmentType: string | null;
  level: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryNegotiable?: boolean;
  currency?: string;
  expiresAt?: string | null;
};

export type SavedJobsListResponse = {
  data: SavedJobItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
};

export type SavedJobsQueryParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: "all" | "available" | "unavailable";
  location?: string;
};

export type WishlistSaveResponse = {
  saved: boolean;
  alreadySaved?: boolean;
  message: string;
  id?: string;
};

export type WishlistToggleResponse = {
  saved: boolean;
  message: string;
  id?: string;
};

export type WishlistDeleteResponse = {
  removed: boolean;
  alreadyRemoved?: boolean;
  message: string;
};

export type WishlistBulkDeleteResponse = {
  removedCount: number;
  message: string;
};

export type WishlistCheckResponse = {
  isSaved: boolean;
  wishlistId?: string | null;
};
