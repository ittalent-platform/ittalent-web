import type {
  AdminResolveReportRequest,
  CreateReportRequest,
  CreateReportResponse,
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
} from './reports.constants';

export type ReportItemResponse = PaginatedReportsResponse['items'][number];
export type ReportsCounts = PaginatedReportsResponse['counts'];

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
  search?: string;
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
  evidence_files?: string[];
  status: ReportStatus;
  statusLabel?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
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
