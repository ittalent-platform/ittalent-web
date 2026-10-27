export type ReportTargetType = 'job' | 'enterprise' | 'company' | 'user';

export type ReportReasonCategory =
  | 'scam_fraud'
  | 'fee_extortion'
  | 'misleading_info'
  | 'offensive_content'
  | 'impersonation'
  | 'harassment'
  | 'other';

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected' | 'withdrawn';

export type ReportResolutionDecision = 'resolved' | 'rejected';

export type ReportActionTaken =
  | 'warning_issued'
  | 'content_takedown'
  | 'account_suspended'
  | 'none';

export interface ReportTimelineItem {
  status: ReportStatus | string;
  timestamp: string;
  note?: string | null;
}

export interface ReportDto {
  id: string;
  ticket_id: string;
  reference?: string;
  target_type: ReportTargetType;
  target_id: string;
  target_title: string;
  target_link?: string | null;
  target?: {
    type: ReportTargetType;
    id: string;
    title: string;
    subtitle: string;
    isAvailable?: boolean;
  };
  reason_category: ReportReasonCategory;
  reason?: string;
  reasonLabel?: string;
  title: string;
  description: string;
  statement?: string;
  evidence_files: string[];
  is_anonymous: boolean;
  status: ReportStatus;
  statusLabel?: string;
  statusDescription?: string;
  withdrawal_reason?: string | null;
  withdrawn_at?: string | null;
  resolution_decision?: ReportResolutionDecision | null;
  action_taken?: ReportActionTaken | null;
  message_to_reporter?: string | null;
  responseFromPlatform?: string | null;
  resolved_at?: string | null;
  timeline: ReportTimelineItem[];
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReportDto extends ReportDto {
  reporter: {
    id: string;
    email: string;
    full_name?: string | null;
    username?: string | null;
    created_at?: string | null;
  };
  assigned_admin?: {
    id: string;
    email: string;
    full_name?: string | null;
  } | null;
  reviewed_at?: string | null;
  internal_notes?: string | null;
}

export interface ReportKpis {
  total: number;
  pending: number;
  reviewing: number;
  resolved: number;
  rejected: number;
  withdrawn: number;
}

export interface PaginatedReportsResult<T> {
  success?: boolean;
  items: T[];
  kpis?: ReportKpis;
  counts?: {
    all: number;
    open: number;
    closed: number;
  };
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateReportInput {
  target_type: ReportTargetType;
  target_id: string;
  target_link?: string;
  reason_category: ReportReasonCategory;
  title: string;
  description: string;
  evidence_files?: string[];
  is_anonymous?: boolean;
}

export interface WithdrawReportInput {
  withdrawal_reason?: string;
}

export interface AdminResolveReportInput {
  decision: ReportResolutionDecision;
  action_taken?: ReportActionTaken;
  internal_notes: string;
  message_to_reporter: string;
}

export interface ReporterReportsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface AdminReportsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  target_type?: string;
  category?: string;
  search?: string;
}
