import type { ApplicationDetailDto, ApplicationHistoryResponse, ApplicationListResponse } from "@/api/generated/types.gen";
import type { TimelineTone } from "@/components/common/timeline";
import type { DocumentKind } from "@/components/common/document-chip";

export { APPLICATIONS_PATH } from "@/config/routes";

export type ApplicationItem = ApplicationListResponse["items"][number];
export type ApplicationStatus = ApplicationItem["status"];
export type ReviewStage = NonNullable<ApplicationDetailDto["reviewStage"]>;
export type ActorRole = ApplicationHistoryResponse["items"][number]["actorRole"];

// Board columns and filter options follow the candidate-facing lifecycle (UC-MYAPP-01.AC.3).
export const APPLICATION_STATUSES: readonly ApplicationStatus[] = ["submitted", "under_review", "interviewing", "offered", "hired", "rejected", "withdrawn"];
// Quick presets in the status filter popover.
export const IN_PROGRESS_STATUSES: readonly ApplicationStatus[] = ["submitted", "under_review", "interviewing", "offered"];
export const CLOSED_STATUSES: readonly ApplicationStatus[] = ["hired", "rejected", "withdrawn"];
export const REVIEW_STAGES: readonly ReviewStage[] = ["screening", "interview", "offer", "hired", "rejected"];
export const JOB_ID_PATTERN = /^[a-f\d]{24}$/i;
export const STATUS_LIST_SEPARATOR = ",";
// BR-APP-004: a candidate may only withdraw before the interview stage.
export const WITHDRAWABLE_STATUSES: readonly ApplicationStatus[] = ["submitted", "under_review"];
export const WITHDRAW_TARGET_STATUS: ApplicationStatus = "withdrawn";
// Stages shown in the detail stepper; Rejected and Withdrawn end the pipeline, so they show a callout instead.
export const PIPELINE_STEPS: readonly ApplicationStatus[] = ["submitted", "under_review", "interviewing", "offered", "hired"];

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
export const HISTORY_PAGE_SIZE = 100;
export const MAX_SEARCH_LENGTH = 100;
export const MAX_REASON_LENGTH = 500;
export const SEARCH_DEBOUNCE_MS = 300;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_NOT_FOUND = 404;
export const HTTP_CONFLICT = 409;
export const TOAST_DURATION_MS = 5000;
export const MS_PER_DAY = 86_400_000;

export type ViewMode = "table" | "board";
export const VIEW_MODES: readonly ViewMode[] = ["table", "board"];
export const DEFAULT_VIEW: ViewMode = "table";

export type SubmittedRange = "any" | "7d" | "30d" | "90d" | "custom";
export const SUBMITTED_RANGE_DAYS: Record<Exclude<SubmittedRange, "any" | "custom">, number> = { "7d": 7, "30d": 30, "90d": 90 };
export const SUBMITTED_RANGES: readonly SubmittedRange[] = ["any", "7d", "30d", "90d", "custom"];

export type SortField = "submittedAt" | "latestStatusAt" | "id";
export type SortOrder = "asc" | "desc";
export const SORT_FIELDS: readonly SortField[] = ["submittedAt", "latestStatusAt", "id"];
export const DEFAULT_SORT: { sortBy: SortField; sortOrder: SortOrder } = { sortBy: "submittedAt", sortOrder: "desc" };

/** Query-string keys that make up the list state, so the URL is the single source of truth. */
export const PARAM = { page: "page", limit: "limit", search: "search", status: "status", range: "range", from: "from", to: "to", stage: "stage", jobId: "jobId", sortBy: "sortBy", sortOrder: "sortOrder", view: "view" } as const;

export const ATTACHMENT_KIND: Record<string, DocumentKind> = { cv: "cv", cover_letter: "cover_letter" };

/** Tint pair per status (DESIGN.md "Status"): the word is always shown, colour only reinforces it. */
export const STATUS_TONES: Record<ApplicationStatus, { badge: string; text: string; dot: string; border: string; ring: string }> = {
  submitted: { badge: "bg-(--status-neutral-bg) text-(--status-neutral-fg)", text: "text-(--status-neutral-fg)", dot: "bg-(--status-neutral-fg)", border: "border-t-(--status-neutral-fg)", ring: "ring-(--status-neutral-fg)/40" },
  under_review: { badge: "bg-(--status-info-bg) text-(--status-info-fg)", text: "text-(--status-info-fg)", dot: "bg-(--status-info-fg)", border: "border-t-(--status-info-fg)", ring: "ring-(--status-info-fg)/40" },
  interviewing: { badge: "bg-(--status-blocked-bg) text-(--status-blocked-fg)", text: "text-(--status-blocked-fg)", dot: "bg-(--status-blocked-fg)", border: "border-t-(--status-blocked-fg)", ring: "ring-(--status-blocked-fg)/40" },
  offered: { badge: "bg-(--status-warning-bg) text-(--status-warning-fg)", text: "text-(--status-warning-fg)", dot: "bg-(--status-warning-fg)", border: "border-t-(--status-warning-fg)", ring: "ring-(--status-warning-fg)/40" },
  hired: { badge: "bg-(--status-success-bg) text-(--status-success-fg)", text: "text-(--status-success-fg)", dot: "bg-(--status-success-fg)", border: "border-t-(--status-success-fg)", ring: "ring-(--status-success-fg)/40" },
  rejected: { badge: "bg-(--status-error-bg) text-(--status-error-fg)", text: "text-(--status-error-fg)", dot: "bg-(--status-error-fg)", border: "border-t-(--status-error-fg)", ring: "ring-(--status-error-fg)/40" },
  withdrawn: { badge: "bg-(--status-neutral-bg) text-muted-foreground", text: "text-muted-foreground", dot: "bg-muted-foreground", border: "border-t-muted-foreground", ring: "ring-muted-foreground/40" },
};

// Only an interview asks the candidate to act, so it is the one "next step" set in a status colour.
export const NEXT_STEP_TEXT: Partial<Record<ApplicationStatus, string>> = { interviewing: "text-(--status-blocked-fg)" };

export const TIMELINE_TONES: Record<ApplicationStatus, TimelineTone> = {
  submitted: "neutral",
  under_review: "info",
  interviewing: "violet",
  offered: "warning",
  hired: "success",
  rejected: "error",
  withdrawn: "neutral",
};

export function isWithdrawable(status: ApplicationStatus): boolean {
  return WITHDRAWABLE_STATUSES.includes(status);
}
