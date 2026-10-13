import type { InterviewListResponse } from "@/api/generated/types.gen";

export type InterviewItem = InterviewListResponse["items"][number];
export type InterviewStatus = InterviewItem["status"];
export type InterviewMode = InterviewItem["mode"];

export const INTERVIEW_STATUSES: readonly InterviewStatus[] = ["scheduled", "completed", "no_show", "cancelled"];

/** Value of a filter that is not narrowing anything. */
export const ALL_OPTION = "all";

/** Date presets of the "Date" filter; each one becomes a from / to window in Vietnam time. */
export const INTERVIEW_DATE_FILTERS = ["today", "thisWeek", "thisMonth", "upcoming", "past"] as const;
export type InterviewDateFilter = (typeof INTERVIEW_DATE_FILTERS)[number];

/** Query-string keys that hold the list state, so links and reloads keep it. */
export const INTERVIEW_PARAMS = { date: "date", sortOrder: "sortOrder", status: "status" } as const;

export type InterviewSortOrder = "asc" | "desc";
export const DEFAULT_SORT_ORDER: InterviewSortOrder = "asc";

/** Longest keyword the API accepts. */
export const INTERVIEW_SEARCH_MAX_LENGTH = 100;

export const INTERVIEW_DEFAULT_LIMIT = 10;
export const INTERVIEW_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
export const INTERVIEW_SKELETON_ROWS = 5;

/** Interviews are always shown in Vietnam time, whatever the time zone of the browser. */
export const INTERVIEW_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const INTERVIEW_UTC_OFFSET_HOURS = 7;
export const INTERVIEW_TIME_ZONE_LABEL = "Asia/Ho Chi Minh (GMT+7)";

export const MINUTES_PER_HOUR = 60;
export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;
export const DAYS_PER_WEEK = 7;
/** 1 January 1970 was a Thursday; used to find the Monday that starts a week. */
export const EPOCH_DAY_OF_WEEK = 4;
export const MONDAY = 1;

export const STATUS_BADGE_VARIANT = {
  cancelled: "neutral",
  completed: "success",
  no_show: "warning",
  scheduled: "info",
} as const satisfies Record<InterviewStatus, string>;

export const MODE_BADGE_VARIANT = { online: "blocked", onsite: "warning" } as const satisfies Record<InterviewMode, string>;

/** HTTP status the API answers with when the account has no enterprise (or HR access was removed). */
export const FORBIDDEN_STATUS = 403;
