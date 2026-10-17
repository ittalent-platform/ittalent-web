import type {
  RecruiterApplicantCompanyHistoryResponse,
  RecruiterApplicationDetailDto,
  RecruiterApplicationListResponse,
  RecruiterApplicationSummaryDto,
  RecruiterAttachmentDto,
  RecruiterInterviewTimelineEntryDto,
  RecruiterNoteEntryDto,
} from "@/api/generated/types.gen";
import type { TimelineTone } from "@/components/common/timeline";
import type { DocumentKind } from "@/components/common/document-chip";

export { RECRUITER_APPLICATIONS_PATH, recruiterApplicationPath } from "@/config/routes";

export type ApplicationItem = RecruiterApplicationSummaryDto;
export type ApplicationStatus = ApplicationItem["status"];
export type ReviewStage = NonNullable<ApplicationItem["reviewStage"]>;
export type RecruiterApplicationList = RecruiterApplicationListResponse;
export type RecruiterApplicationDetail = RecruiterApplicationDetailDto;
export type RecruiterCompanyHistory = RecruiterApplicantCompanyHistoryResponse;
export type RecruiterNoteItem = RecruiterNoteEntryDto;
export type RecruiterAttachment = RecruiterAttachmentDto;
export type RecruiterInterviewTimelineEntry = RecruiterInterviewTimelineEntryDto;

/** Candidate lifecycle stages visible to recruiter and hiring managers. */
export const APPLICATION_STATUSES = [
  "submitted",
  "under_review",
  "interviewing",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
  "position_filled",
] as const satisfies readonly ApplicationStatus[];

/** Presets for status filter popover and quick filters. */
export const IN_PROGRESS_STATUSES = [
  "submitted",
  "under_review",
  "interviewing",
  "offered",
] as const satisfies readonly ApplicationStatus[];

export const CLOSED_STATUSES = [
  "hired",
  "rejected",
  "withdrawn",
  "position_filled",
] as const satisfies readonly ApplicationStatus[];

export const REVIEW_STAGES = [
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const satisfies readonly ReviewStage[];

export const DOCUMENT_TYPES = ["cv", "cover_letter"] as const;
export type RecruiterDocumentType = (typeof DOCUMENT_TYPES)[number];

export const STATUS_LIST_SEPARATOR = ",";

/**
 * Permitted recruitment status transitions per BR-17.
 * Terminal states (hired, rejected, withdrawn, position_filled) have no further transitions.
 */
export const PERMITTED_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  submitted: ["under_review", "rejected"],
  under_review: ["interviewing", "rejected"],
  interviewing: ["offered", "rejected"],
  offered: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: [],
  position_filled: [],
};

export function isTransitionPermitted(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return PERMITTED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * 7 recruitment lifecycle stages displayed on the Kanban board matching design.
 * Position filled is an automated vacancy state and not rendered as a primary column.
 */
export const KANBAN_COLUMNS = [
  "submitted",
  "under_review",
  "interviewing",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
] as const satisfies readonly ApplicationStatus[];

export type KanbanColumnStatus = (typeof KANBAN_COLUMNS)[number];

/** Candidates in terminal stages cannot be dragged or transitioned. */
export function isKanbanDraggable(status: ApplicationStatus): boolean {
  return (
    status !== "hired" &&
    status !== "rejected" &&
    status !== "withdrawn" &&
    status !== "position_filled"
  );
}

/** Default and limit configurations. */
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
export const HISTORY_PAGE_SIZE = 100;
export const MIN_SEARCH_LENGTH = 1;
export const MAX_SEARCH_LENGTH = 100;
export const MIN_REJECTION_REASON_LENGTH = 5;
export const MAX_REJECTION_REASON_LENGTH = 1000;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_NOTE_LENGTH = 1000;
export const SEARCH_DEBOUNCE_MS = 300;
export const TOAST_DURATION_MS = 5000;

export type ViewMode = "table" | "board";
export const VIEW_MODES = ["table", "board"] as const;
export const DEFAULT_VIEW: ViewMode = "table";

export type SortField = "submittedAt" | "latestStatusAt" | "id";
export type SortOrder = "asc" | "desc";
export const SORT_FIELDS = ["submittedAt", "latestStatusAt", "id"] as const;
export const SORT_ORDERS = ["asc", "desc"] as const;
export const DEFAULT_SORT = { sortBy: "submittedAt" as SortField, sortOrder: "desc" as SortOrder };

export type SubmittedRange = "any" | "7d" | "30d" | "90d" | "custom";
export const SUBMITTED_RANGE_DAYS: Record<Exclude<SubmittedRange, "any" | "custom">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};
export const SUBMITTED_RANGES: readonly SubmittedRange[] = ["any", "7d", "30d", "90d", "custom"];
export const MS_PER_DAY = 86_400_000;
export const JOB_ID_PATTERN = /^[a-f\d]{24}$/i;

/** URL query-param keys for list and board state single source of truth. */
export const PARAM = {
  page: "page",
  limit: "limit",
  search: "search",
  status: "status",
  jobId: "jobId",
  documentType: "documentType",
  range: "range",
  from: "from",
  to: "to",
  submittedFrom: "submittedFrom",
  submittedTo: "submittedTo",
  sortBy: "sortBy",
  sortOrder: "sortOrder",
  view: "view",
} as const;

export const ATTACHMENT_KIND: Record<string, DocumentKind> = {
  cv: "cv",
  cover_letter: "cover_letter",
};

/**
 * Status visual tint pair matching DESIGN.md.
 * Status word is always displayed; color reinforces it.
 */
export const STATUS_TONES: Record<
  ApplicationStatus,
  { badge: string; text: string; dot: string; border: string; ring: string }
> = {
  submitted: {
    badge: "bg-(--status-neutral-bg) text-(--status-neutral-fg)",
    text: "text-(--status-neutral-fg)",
    dot: "bg-(--status-neutral-fg)",
    border: "border-t-(--status-neutral-fg)",
    ring: "ring-(--status-neutral-fg)/40",
  },
  under_review: {
    badge: "bg-(--status-info-bg) text-(--status-info-fg)",
    text: "text-(--status-info-fg)",
    dot: "bg-(--status-info-fg)",
    border: "border-t-(--status-info-fg)",
    ring: "ring-(--status-info-fg)/40",
  },
  interviewing: {
    badge: "bg-(--status-blocked-bg) text-(--status-blocked-fg)",
    text: "text-(--status-blocked-fg)",
    dot: "bg-(--status-blocked-fg)",
    border: "border-t-(--status-blocked-fg)",
    ring: "ring-(--status-blocked-fg)/40",
  },
  offered: {
    badge: "bg-(--status-warning-bg) text-(--status-warning-fg)",
    text: "text-(--status-warning-fg)",
    dot: "bg-(--status-warning-fg)",
    border: "border-t-(--status-warning-fg)",
    ring: "ring-(--status-warning-fg)/40",
  },
  hired: {
    badge: "bg-(--status-success-bg) text-(--status-success-fg)",
    text: "text-(--status-success-fg)",
    dot: "bg-(--status-success-fg)",
    border: "border-t-(--status-success-fg)",
    ring: "ring-(--status-success-fg)/40",
  },
  rejected: {
    badge: "bg-(--status-error-bg) text-(--status-error-fg)",
    text: "text-(--status-error-fg)",
    dot: "bg-(--status-error-fg)",
    border: "border-t-(--status-error-fg)",
    ring: "ring-(--status-error-fg)/40",
  },
  withdrawn: {
    badge: "bg-(--status-neutral-bg) text-muted-foreground",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    border: "border-t-muted-foreground",
    ring: "ring-muted-foreground/40",
  },
  position_filled: {
    badge: "bg-(--status-neutral-bg) text-muted-foreground",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    border: "border-t-muted-foreground",
    ring: "ring-muted-foreground/40",
  },
};

export const TIMELINE_TONES: Record<ApplicationStatus, TimelineTone> = {
  submitted: "neutral",
  under_review: "info",
  interviewing: "violet",
  offered: "warning",
  hired: "success",
  rejected: "error",
  withdrawn: "neutral",
  position_filled: "neutral",
};

/** Candidate reply state to interview invitations per Frame 18 and BR-S2-INT-002. */
export type InterviewReplyState = "awaiting_reply" | "accepted" | "new_time_requested" | "declined";

export const INTERVIEW_REPLY_TONES: Record<
  InterviewReplyState,
  { badge: string; text: string; dot: string }
> = {
  awaiting_reply: {
    badge: "bg-(--status-warning-bg) text-(--status-warning-fg)",
    text: "text-(--status-warning-fg)",
    dot: "bg-(--status-warning-fg)",
  },
  accepted: {
    badge: "bg-(--status-success-bg) text-(--status-success-fg)",
    text: "text-(--status-success-fg)",
    dot: "bg-(--status-success-fg)",
  },
  new_time_requested: {
    badge: "bg-(--status-info-bg) text-(--status-info-fg)",
    text: "text-(--status-info-fg)",
    dot: "bg-(--status-info-fg)",
  },
  declined: {
    badge: "bg-(--status-error-bg) text-(--status-error-fg)",
    text: "text-(--status-error-fg)",
    dot: "bg-(--status-error-fg)",
  },
};
