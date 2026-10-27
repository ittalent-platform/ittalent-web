import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { client } from '@/api/client';
import { unwrap } from '@/api/request-error';
import type {
  AdminReportDto,
  AdminReportsQueryParams,
  AdminResolveReportInput,
  CreateReportInput,
  PaginatedReportsResult,
  ReportActionTaken,
  ReportDto,
  ReporterReportsQueryParams,
  ReportKpis,
  ReportReasonCategory,
  ReportResolutionDecision,
  ReportStatus,
  ReportTargetType,
  ReportTimelineItem,
  WithdrawReportInput,
} from './reports.types';

export const reportsKeys = {
  all: ['reports'] as const,
  myReports: () => [...reportsKeys.all, 'mine'] as const,
  myReportsList: (params: ReporterReportsQueryParams) => [...reportsKeys.myReports(), 'list', params] as const,
  myReportDetail: (id: string) => [...reportsKeys.myReports(), 'detail', id] as const,
  adminReports: () => [...reportsKeys.all, 'admin'] as const,
  adminReportsList: (params: AdminReportsQueryParams) => [...reportsKeys.adminReports(), 'list', params] as const,
  adminReportDetail: (id: string) => [...reportsKeys.adminReports(), 'detail', id] as const,
};

interface RawReportInput {
  id?: string;
  _id?: string;
  ticket_id?: string;
  reference?: string;
  target_type?: ReportTargetType;
  target_id?: string;
  target_title?: string;
  target_link?: string | null;
  target?: {
    type?: ReportTargetType;
    id?: string;
    title?: string;
    subtitle?: string;
    isAvailable?: boolean;
  };
  reason_category?: ReportReasonCategory;
  reason?: string;
  reasonLabel?: string;
  title?: string;
  description?: string;
  statement?: string;
  evidence_files?: Array<string | { file_url?: string; downloadUrl?: string }>;
  files?: Array<{ downloadUrl?: string; file_url?: string }>;
  is_anonymous?: boolean;
  status?: ReportStatus;
  statusLabel?: string;
  statusDescription?: string;
  withdrawal_reason?: string | null;
  withdrawn_at?: string | null;
  resolution_decision?: ReportResolutionDecision | null;
  action_taken?: ReportActionTaken | null;
  message_to_reporter?: string | null;
  responseFromPlatform?: string | null;
  resolved_at?: string | null;
  timeline?: ReportTimelineItem[];
  history?: Array<{ event?: string; timestamp?: string; label?: string | null }>;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RawReportsListResponse {
  items?: RawReportInput[];
  counts?: {
    all: number;
    open: number;
    closed: number;
  };
  kpis?: ReportKpis;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function normalizeReportDto(item: RawReportInput): ReportDto {
  const target = item.target;
  const targetType = (item.target_type || target?.type || 'job') as ReportTargetType;
  const targetTitle = item.target_title || target?.title || 'Chưa có tiêu đề';
  const targetLink = item.target_link || target?.subtitle || null;
  const reasonCategory = (item.reason_category || item.reason || 'other') as ReportReasonCategory;
  const title = item.title || targetTitle;
  const description = item.description || item.statement || '';
  const evidenceFiles = Array.isArray(item.evidence_files)
    ? item.evidence_files.map((f) => (typeof f === 'string' ? f : f?.file_url || f?.downloadUrl || ''))
    : Array.isArray(item.files)
      ? item.files.map((f) => f?.downloadUrl || f?.file_url || '')
      : [];

  const timeline = Array.isArray(item.timeline) && item.timeline.length > 0
    ? item.timeline
    : Array.isArray(item.history)
      ? item.history.map((h) => ({
          status: (h.event || item.status || 'pending') as ReportStatus,
          timestamp: h.timestamp || new Date().toISOString(),
          note: h.label || null,
        }))
      : [];

  return {
    id: item.id || item._id || '',
    ticket_id: item.ticket_id || item.reference || '',
    reference: item.reference || item.ticket_id,
    target_type: targetType,
    target_id: item.target_id || target?.id || '',
    target_title: targetTitle,
    target_link: targetLink,
    target: target
      ? {
          type: (target.type || targetType) as ReportTargetType,
          id: target.id || item.target_id || '',
          title: target.title || targetTitle,
          subtitle: target.subtitle || targetLink || '',
          isAvailable: target.isAvailable ?? true,
        }
      : {
          type: targetType,
          id: item.target_id || '',
          title: targetTitle,
          subtitle: targetLink || '',
          isAvailable: true,
        },
    reason_category: reasonCategory,
    reason: item.reason || reasonCategory,
    reasonLabel: item.reasonLabel,
    title,
    description,
    statement: item.statement || description,
    evidence_files: evidenceFiles,
    is_anonymous: Boolean(item.is_anonymous),
    status: item.status || 'pending',
    statusLabel: item.statusLabel,
    statusDescription: item.statusDescription,
    withdrawal_reason: item.withdrawal_reason ?? null,
    withdrawn_at: item.withdrawn_at ?? null,
    resolution_decision: item.resolution_decision ?? null,
    action_taken: item.action_taken ?? null,
    message_to_reporter: item.message_to_reporter ?? item.responseFromPlatform ?? null,
    responseFromPlatform: item.responseFromPlatform ?? item.message_to_reporter ?? null,
    resolved_at: item.resolved_at ?? null,
    timeline,
    submittedAt: item.submittedAt || item.createdAt || new Date().toISOString(),
    createdAt: item.createdAt || item.submittedAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.submittedAt || new Date().toISOString(),
  };
}

// UC-30: Submit a report
export function useSubmitReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReportInput): Promise<ReportDto> => {
      const res = await client.post<{ 201: { success: boolean; data: RawReportInput } | RawReportInput }>({
        url: '/api/v1/reports',
        body: input,
      });

      const response = unwrap(res, 'Không thể gửi báo cáo vi phạm');
      const data = 'data' in response && response.data ? response.data : (response as RawReportInput);
      return normalizeReportDto(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
    },
  });
}

// UC-31: Reporter list submitted reports
export function useMyReportsQuery(params: ReporterReportsQueryParams = {}) {
  const { page = 1, limit = 10, status = 'all' } = params;

  return useQuery({
    queryKey: reportsKeys.myReportsList({ page, limit, status }),
    queryFn: async (): Promise<PaginatedReportsResult<ReportDto>> => {
      const res = await client.get<{ 200: RawReportsListResponse }>({
        url: '/api/v1/me/reports',
        query: {
          page,
          limit,
          status,
        },
      });

      const raw = unwrap(res, 'Không thể tải danh sách báo cáo');
      const rawItems = Array.isArray(raw?.items) ? raw.items : [];
      const items: ReportDto[] = rawItems.map(normalizeReportDto);

      const kpis = raw?.kpis ?? {
        total: raw?.counts?.all ?? raw?.pagination?.total ?? items.length,
        pending: raw?.counts?.open ?? items.filter((i: ReportDto) => i.status === 'pending').length,
        reviewing: items.filter((i: ReportDto) => i.status === 'reviewing').length,
        resolved: raw?.counts?.closed ?? items.filter((i: ReportDto) => i.status === 'resolved').length,
        rejected: items.filter((i: ReportDto) => i.status === 'rejected').length,
        withdrawn: items.filter((i: ReportDto) => i.status === 'withdrawn').length,
      };

      return {
        success: true,
        items,
        kpis,
        counts: raw?.counts,
        page: raw?.page ?? raw?.pagination?.page ?? page,
        limit: raw?.limit ?? raw?.pagination?.limit ?? limit,
        total: raw?.total ?? raw?.pagination?.total ?? items.length,
        totalPages: raw?.totalPages ?? raw?.pagination?.totalPages ?? 1,
      };
    },
  });
}

// UC-32: View reporter report detail
export function useMyReportDetailQuery(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: reportsKeys.myReportDetail(id ?? ''),
    queryFn: async (): Promise<ReportDto> => {
      const res = await client.get<{ 200: { success: boolean; data: RawReportInput } | RawReportInput }>({
        url: `/api/v1/me/reports/${id}`,
      });

      const response = unwrap(res, 'Không thể tải chi tiết báo cáo');
      const item = 'data' in response && response.data ? response.data : (response as RawReportInput);
      return normalizeReportDto(item);
    },
  });
}

// UC-33: Withdraw report
export function useWithdrawReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input?: WithdrawReportInput;
    }): Promise<ReportDto> => {
      const res = await client.patch<{ 200: { success: boolean; message: string; data: RawReportInput } | RawReportInput }>({
        url: `/api/v1/me/reports/${id}/withdraw`,
        body: input ?? {},
      });

      const response = unwrap(res, 'Không thể rút lại báo cáo');
      const item = 'data' in response && response.data ? response.data : (response as RawReportInput);
      return normalizeReportDto(item);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: reportsKeys.myReportDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
    },
  });
}

// UC-34: Delete report from personal history
export function useDeleteReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await client.delete<{ 200: { success: boolean; message: string } }>({
        url: `/api/v1/me/reports/${id}`,
      });

      unwrap(res, 'Không thể xóa báo cáo khỏi lịch sử');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
    },
  });
}

// UC-35: Admin view list report of reporter
export function useAdminReportsQuery(params: AdminReportsQueryParams = {}) {
  const { page = 1, limit = 10, status = 'pending', target_type = 'all', category = 'all', search } = params;

  return useQuery({
    queryKey: reportsKeys.adminReportsList({ page, limit, status, target_type, category, search }),
    queryFn: async (): Promise<PaginatedReportsResult<AdminReportDto>> => {
      const res = await client.get<{ 200: PaginatedReportsResult<AdminReportDto> }>({
        url: '/api/v1/admin/reports',
        query: {
          page,
          limit,
          status,
          target_type,
          category,
          ...(search ? { search } : {}),
        },
      });

      return unwrap(res, 'Không thể tải danh sách kiểm duyệt vi phạm');
    },
  });
}

// UC-36: Admin report detail
export function useAdminReportDetailQuery(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: reportsKeys.adminReportDetail(id ?? ''),
    queryFn: async (): Promise<AdminReportDto> => {
      const res = await client.get<{ 200: { success: boolean; data: AdminReportDto } }>({
        url: `/api/v1/admin/reports/${id}`,
      });

      const response = unwrap(res, 'Không thể tải thông tin báo cáo');
      return response.data;
    },
  });
}

// UC-36: Claim ticket
export function useAdminClaimTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<AdminReportDto> => {
      const res = await client.patch<{ 200: { success: boolean; data: AdminReportDto } }>({
        url: `/api/v1/admin/reports/${id}/claim`,
      });

      const response = unwrap(res, 'Không thể nhận xử lý báo cáo');
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReportDetail(id) });
    },
  });
}

// UC-36: Finalize resolution
export function useAdminResolveTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: AdminResolveReportInput;
    }): Promise<AdminReportDto> => {
      const res = await client.patch<{ 200: { success: boolean; message: string; data: AdminReportDto } }>({
        url: `/api/v1/admin/reports/${id}/resolve`,
        body: input,
      });

      const response = unwrap(res, 'Không thể hoàn tất xử lý báo cáo');
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReportDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
    },
  });
}
