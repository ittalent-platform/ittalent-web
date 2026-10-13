import type { InterviewDetailDto, InterviewListResponse } from "@/api/generated/types.gen";
import type { TimelineTone } from "@/components/common/timeline";

export type InterviewItem = InterviewListResponse["items"][number];
export type InterviewStatus = InterviewItem["status"];
export type InterviewMode = InterviewItem["mode"];
export type InterviewDetail = InterviewDetailDto;

export const INTERVIEW_STATUSES: readonly InterviewStatus[] = ["scheduled", "completed", "no_show", "cancelled"];

/** Value of a filter that is not narrowing anything. */
export const ALL_OPTION = "all";

/** Date presets of the "Date" filter; each one becomes a from / to window in Vietnam time. */
export const INTERVIEW_DATE_FILTERS = ["today", "thisWeek", "thisMonth", "upcoming", "past"] as const;
export type InterviewDateFilter = (typeof INTERVIEW_DATE_FILTERS)[number];

/** The two ways to look at the interviews; the table is the default. */
export const INTERVIEW_VIEWS = ["table", "calendar"] as const;
export type InterviewView = (typeof INTERVIEW_VIEWS)[number];

/** Query-string keys that hold the view's state, so links and reloads keep it. */
export const INTERVIEW_PARAMS = { date: "date", month: "month", sortOrder: "sortOrder", status: "status", view: "view" } as const;

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
export const INTERVIEW_TIME_ZONE_NAME = "Asia/Ho Chi Minh";
export const INTERVIEW_TIME_ZONE_LABEL = `${INTERVIEW_TIME_ZONE_NAME} (GMT+7)`;

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

/** Dot colour of each status in the history, matching the status badge. */
export const HISTORY_TONE = {
  cancelled: "error",
  completed: "success",
  no_show: "warning",
  scheduled: "info",
} as const satisfies Record<InterviewStatus, TimelineTone>;

export const MODE_BADGE_VARIANT = { online: "blocked", onsite: "warning" } as const satisfies Record<InterviewMode, string>;

/** HTTP status the API answers with when the account has no enterprise (or HR access was removed). */
export const FORBIDDEN_STATUS = 403;

/** HTTP statuses the API answers with when an interview is missing, belongs to another company or the id is malformed. */
export const NOT_FOUND_STATUS = 404;
export const BAD_REQUEST_STATUS = 400;

/** Most interview chips a day of the calendar shows before "+N more". */
export const CALENDAR_CHIPS_PER_DAY = 3;
/** Interviews are listed from the first day of the week; the calendar starts on Sunday. */
export const SUNDAY = 0;

/** Chip colours of the calendar, one per status (the same tones as the status badge). */
export const CHIP_TONE_CLASS = {
  cancelled: "bg-(--status-neutral-bg) text-(--status-neutral-fg)",
  completed: "bg-(--status-success-bg) text-(--status-success-fg)",
  no_show: "bg-(--status-warning-bg) text-(--status-warning-fg)",
  scheduled: "bg-(--status-info-bg) text-(--status-info-fg)",
} as const satisfies Record<InterviewStatus, string>;

/** What a calendar chip shows besides the interview's colour. */
export type CalendarField = "time" | "applicant" | "job";
export const CALENDAR_FIELDS: readonly CalendarField[] = ["time", "applicant", "job"];
