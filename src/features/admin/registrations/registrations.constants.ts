export type RegistrationQueueTab = "pending" | "approved" | "rejected";

export const QUEUE_TAB_STATUS_MAP: Record<RegistrationQueueTab, "pending_review" | "approved" | "rejected"> = {
  pending: "pending_review",
  approved: "approved",
  rejected: "rejected",
};

export type QueueSortOption = "oldest" | "newest";

export type QueueTimeFilter = "any" | "7d" | "30d";
