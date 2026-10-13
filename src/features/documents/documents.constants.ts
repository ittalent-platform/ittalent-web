export const DOCUMENT_LIST_DEFAULT_LIMIT = 10;
export const DOCUMENT_LIST_PARAMS = {
  sortOrder: "sort_order",
  type: "type",
} as const;

export const DOCUMENT_TYPES = ["cv", "cover_letter"] as const;
export const DOCUMENT_SORT_ORDERS = ["asc", "desc"] as const;
export const ALL_DOCUMENTS = "all";
