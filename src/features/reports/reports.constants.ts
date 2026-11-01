import type { ReportStatus } from '@/config/reports';

export {
  CANDIDATE_REPORT_ROLES,
  CLOSED_REPORT_STATUSES,
  OPEN_REPORT_STATUSES,
  REPORT_CANDIDATE_TABS,
  REPORT_EVIDENCE_ACCEPT,
  REPORT_EVIDENCE_MIME_BY_EXT,
  REPORT_LIMITS,
  REPORT_REASONS,
  REPORT_STATUSES,
  UNAVAILABLE_TARGET_BACKEND_SUBTITLE,
  cleanEvidenceFileName,
  formatReportTargetSubtitle,
  isCandidateReportRole,
  normalizeEvidenceFileForUpload,
  validateReportEvidenceFile,
  type AllowedEvidenceExtension,
  type ReportCandidateTab,
  type ReportReason,
  type ReportStatus,
  type ReportTargetType,
} from '@/config/reports';

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
