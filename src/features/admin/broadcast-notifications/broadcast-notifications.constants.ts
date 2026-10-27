import type {
  BroadcastAudience,
  BroadcastCategory,
  BroadcastChannel,
  BroadcastPriority,
  BroadcastStatus,
} from "./broadcast-notifications.types";

export const BROADCAST_CATEGORIES: readonly BroadcastCategory[] = [
  "System Maintenance",
  "Feature Update",
  "Policy Update",
  "Event Announcement",
  "Security Alert",
] as const;

export const BROADCAST_AUDIENCES: readonly BroadcastAudience[] = [
  "All Users",
  "Applicants only",
  "Recruiters only",
  "Enterprise Admins",
] as const;

export const BROADCAST_PRIORITIES: readonly BroadcastPriority[] = [
  "Low",
  "Normal",
  "High",
  "Urgent",
] as const;

export const BROADCAST_STATUSES: readonly BroadcastStatus[] = [
  "Draft",
  "Scheduled",
  "Sent",
  "Cancelled",
] as const;

export const BROADCAST_CHANNELS: readonly BroadcastChannel[] = [
  "In-App Inbox",
  "Email Digest",
] as const;

export const MIN_SCHEDULE_ADVANCE_MS = 15 * 60 * 1000; // 15 minutes
export const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

export const BROADCAST_SORT_FIELD_BY_COLUMN: Record<string, "createdAt" | "scheduled_at" | "title" | "status"> = {
  createdAt: "createdAt",
  scheduledAt: "scheduled_at",
  status: "status",
  title: "title",
};
