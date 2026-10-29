export const REPORT_REASONS = [
  'scam_or_fraud',
  'misleading_information',
  'discrimination',
  'inappropriate_content',
  'something_else',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = [
  'pending',
  'reviewing',
  'resolved',
  'rejected',
  'withdrawn',
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const OPEN_REPORT_STATUSES: readonly ReportStatus[] = ['pending', 'reviewing'];
export const CLOSED_REPORT_STATUSES: readonly ReportStatus[] = ['resolved', 'rejected', 'withdrawn'];

export const REPORT_CANDIDATE_TABS = ['all', 'open', 'closed'] as const;
export type ReportCandidateTab = (typeof REPORT_CANDIDATE_TABS)[number];

export type ReportTargetType = 'job' | 'company' | 'enterprise' | 'user';

export const REPORT_LIMITS = {
  STATEMENT_MIN: 1,
  STATEMENT_MAX: 2000,
  INTERNAL_NOTES_MIN: 5,
  INTERNAL_NOTES_MAX: 1000,
  MESSAGE_TO_REPORTER_MIN: 10,
  MESSAGE_TO_REPORTER_MAX: 500,
  MAX_FILES: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_FILE_SIZE_MB: 5,
} as const;

export const REPORT_STATUS_BADGE_CLASS: Record<ReportStatus, string> = {
  pending: 'bg-(--status-warning-bg) text-(--status-warning-fg) border border-(--status-warning-fg)/20',
  reviewing: 'bg-(--status-info-bg) text-(--status-info-fg) border border-(--status-info-fg)/20',
  resolved: 'bg-(--status-success-bg) text-(--status-success-fg) border border-(--status-success-fg)/20',
  rejected: 'bg-(--status-error-bg) text-(--status-error-fg) border border-(--status-error-fg)/20',
  withdrawn: 'bg-(--sand) text-(--slate-muted) border border-(--line)',
};

export const REPORT_TIMELINE_DOT_CLASS: Record<string, string> = {
  pending: 'bg-(--status-warning-fg)',
  submitted: 'bg-(--status-warning-fg)',
  reviewing: 'bg-(--status-info-fg)',
  review_started: 'bg-(--status-info-fg)',
  resolved: 'bg-(--status-success-fg)',
  rejected: 'bg-(--status-error-fg)',
  withdrawn: 'bg-(--slate-muted)',
};
