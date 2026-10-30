import type {
  AdminResolveReportRequest,
  CreateReportRequest,
  CreateReportResponse,
  GetApiV1ReportsData,
  PaginatedReportsResponse,
  ReportDetailResponse,
  ReportHideResponse,
  ReportWithdrawResponse,
} from '@/api/generated/types.gen';
import type {
  ReportCandidateTab,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '@/config/reports';

export type ReportItemResponse = PaginatedReportsResponse['items'][number];
export type ReportsCounts = PaginatedReportsResponse['counts'];
export type AdminBackendQuery = NonNullable<GetApiV1ReportsData['query']>;
export type AdminBackendStatus = NonNullable<AdminBackendQuery['status']>;
export type AdminBackendTargetType = NonNullable<AdminBackendQuery['target_type']>;

export type AdminSubmittedFilter = 'all' | 'today' | '7d' | '30d';

export type {
  AdminResolveReportRequest,
  CreateReportRequest,
  CreateReportResponse,
  PaginatedReportsResponse,
  ReportCandidateTab,
  ReportDetailResponse,
  ReportHideResponse,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  ReportWithdrawResponse,
};

export interface ReportTargetRef {
  id: string;
  reference?: string;
}

export interface ReporterReportsQueryParams {
  page?: number;
  limit?: number;
  status?: ReportCandidateTab;
  search?: string;
}

export interface AdminReportsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  target_type?: string;
  category?: string;
  submitted?: string;
  search?: string;
}

export interface AdminReportTimelineEntry {
  status: string;
  timestamp: string;
  note?: string | null;
}

export interface AdminReportItem {
  id: string;
  ticket_id: string;
  reference?: string;
  target_type: ReportTargetType;
  target_id: string;
  target_title: string;
  target_link?: string | null;
  reason: string;
  reason_category?: string;
  title?: string;
  description?: string;
  statement?: string;
  evidence_files: string[];
  status: ReportStatus;
  statusLabel?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  reviewed_at?: string | null;
  resolved_at?: string | null;
  withdrawn_at?: string | null;
  withdrawal_reason?: string | null;
  reviewer?: string | null;
  assigned_admin?: {
    id: string;
    email: string;
    full_name?: string | null;
  } | null;
  internal_notes?: string | null;
  message_to_reporter?: string | null;
  resolution_decision?: string | null;
  action_taken?: string | null;
  timeline: AdminReportTimelineEntry[];
}

export interface PaginatedAdminReportsResult {
  items: AdminReportItem[];
  kpis?: {
    total: number;
    pending: number;
    reviewing: number;
    resolved: number;
    rejected: number;
    withdrawn: number;
  };
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
