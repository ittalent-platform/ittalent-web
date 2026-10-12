export const DOCUMENT_LIST_DEFAULT_LIMIT = 10;
export const DOCUMENT_LIST_PARAMS = {
  defaultState: "default",
  sortBy: "sort_by",
  sortOrder: "sort_order",
  type: "type",
} as const;

export const DOCUMENT_TYPES = ["cv", "cover_letter"] as const;
export const DOCUMENT_SORT_FIELDS = [
  "created_at",
  "file_name",
  "size",
] as const;
export const DOCUMENT_SORT_ORDERS = ["asc", "desc"] as const;
export const DOCUMENT_DEFAULT_STATES = ["true", "false"] as const;
export const ALL_DOCUMENTS = "all";
export const OBJECT_URL_REVOKE_DELAY_MS = 1_000;
