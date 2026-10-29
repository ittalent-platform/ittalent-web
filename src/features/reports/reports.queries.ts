import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getApiV1MeReports,
  getApiV1MeReportsById,
  getApiV1Reports,
  getApiV1ReportsById,
  patchApiV1ReportsByIdClaim,
  patchApiV1ReportsByIdResolve,
  postApiV1MeReports,
  postApiV1MeReportsByIdHide,
  postApiV1MeReportsByIdWithdraw,
} from '@/api/generated/sdk.gen';
import type {
  AdminResolveReportRequest,
  CreateReportRequest,
  CreateReportResponse,
  PaginatedReportsResponse,
  ReportDetailResponse,
  ReportHideResponse,
  ReportWithdrawResponse,
} from '@/api/generated/types.gen';
import { unwrap } from '@/api/request-error';
import type {
  AdminReportItem,
  AdminReportsQueryParams,
  PaginatedAdminReportsResult,
  ReporterReportsQueryParams,
} from './reports.types';

export const reportsKeys = {
  all: ['reports'] as const,
  myReports: () => [...reportsKeys.all, 'mine'] as const,
  myReportsList: (params: ReporterReportsQueryParams) => [...reportsKeys.myReports(), 'list', params] as const,
  myReportDetail: (ref: string) => [...reportsKeys.myReports(), 'detail', ref] as const,
  adminReports: () => [...reportsKeys.all, 'admin'] as const,
  adminReportsList: (params: AdminReportsQueryParams) => [...reportsKeys.adminReports(), 'list', params] as const,
  adminReportDetail: (ref: string) => [...reportsKeys.adminReports(), 'detail', ref] as const,
};

// UC-30: Submit a violation report (Candidate)
export interface SubmitReportPayload {
  targetType: 'job' | 'company' | 'user';
  targetId: string;
  reason: 'scam_or_fraud' | 'misleading_information' | 'discrimination' | 'inappropriate_content' | 'something_else';
  statement: string;
  idempotencyKey?: string;
  files?: File[];
}

export function useSubmitReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitReportPayload): Promise<CreateReportResponse> => {
      if (payload.files && payload.files.length > 0) {
        const formData = new FormData();
        formData.append('targetType', payload.targetType);
        formData.append('targetId', payload.targetId);
        formData.append('reason', payload.reason);
        formData.append('statement', payload.statement.trim());
        if (payload.idempotencyKey) {
          formData.append('idempotencyKey', payload.idempotencyKey);
        }
        for (const file of payload.files) {
          formData.append('files', file);
        }

        const res = await postApiV1MeReports({
          body: formData as unknown as CreateReportRequest,
          bodySerializer: null,
          headers: {
            'Content-Type': null as unknown as string,
          },
        });
        return unwrap(res, 'Unable to submit report');
      }

      const res = await postApiV1MeReports({
        body: {
          targetType: payload.targetType,
          targetId: payload.targetId,
          reason: payload.reason,
          statement: payload.statement.trim(),
          idempotencyKey: payload.idempotencyKey,
        },
      });
      return unwrap(res, 'Unable to submit report');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
    },
  });
}

// UC-31: Candidate My Reports List
export function useMyReportsQuery(params: ReporterReportsQueryParams = {}) {
  const { page = 1, limit = 10, status = 'all', search } = params;

  return useQuery<PaginatedReportsResponse>({
    queryKey: reportsKeys.myReportsList({ page, limit, status, search }),
    queryFn: async () => {
      const res = await getApiV1MeReports({
        query: {
          page,
          limit,
          status,
          search: search?.trim() || undefined,
        },
      });
      return unwrap(res, 'Unable to load your reports');
    },
  });
}

// UC-32: Candidate Report Detail
export function useMyReportDetailQuery(ref: string) {
  return useQuery<ReportDetailResponse>({
    queryKey: reportsKeys.myReportDetail(ref),
    queryFn: async () => {
      const res = await getApiV1MeReportsById({
        path: { id: ref },
      });
      return unwrap(res, 'Unable to load report detail');
    },
    enabled: Boolean(ref),
  });
}

// UC-33: Withdraw Pending Report
export function useWithdrawReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }): Promise<ReportWithdrawResponse> => {
      const res = await postApiV1MeReportsByIdWithdraw({
        path: { id },
        body: note ? ({ note } as never) : undefined,
      });
      return unwrap(res, 'Unable to withdraw report');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: reportsKeys.myReportDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
    },
  });
}

// UC-34: Hide Closed Report from History
export function useHideReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<ReportHideResponse> => {
      const res = await postApiV1MeReportsByIdHide({
        path: { id },
      });
      return unwrap(res, 'Unable to hide report');
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: reportsKeys.myReportDetail(id) });
    },
  });
}

// UC-35: Admin Reports Queue
export function useAdminReportsQuery(params: AdminReportsQueryParams = {}) {
  const { page = 1, limit = 10, status = 'pending', target_type = 'all', category = 'all', search } = params;

  return useQuery<PaginatedAdminReportsResult>({
    queryKey: reportsKeys.adminReportsList({ page, limit, status, target_type, category, search }),
    queryFn: async () => {
      const res = await getApiV1Reports({
        query: {
          page,
          limit,
          status: status as never,
          target_type: target_type as never,
          category: category as never,
          search: search?.trim() || undefined,
        },
      });
      const data = unwrap(res, 'Unable to load admin report queue');

      // The backend returns { success, items, kpis, page, limit, total, totalPages }
      const raw = data as unknown as {
        items?: Array<{
          id?: string;
          _id?: string;
          ticket_id?: string;
          reference?: string;
          target_type?: string;
          target_id?: string;
          target_title?: string;
          target_link?: string | null;
          reason?: string;
          reason_category?: string;
          title?: string;
          description?: string;
          statement?: string;
          evidence_files?: string[];
          status?: string;
          statusLabel?: string;
          createdAt?: string;
          updatedAt?: string;
          submittedAt?: string;
          assigned_admin?: {
            id: string;
            email: string;
            full_name?: string | null;
          } | null;
          internal_notes?: string | null;
          message_to_reporter?: string | null;
          resolution_decision?: string | null;
          action_taken?: string | null;
        }>;
        kpis?: PaginatedAdminReportsResult['kpis'];
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
      };

      const items: AdminReportItem[] = (raw.items || []).map((doc) => ({
        id: doc.id || doc._id || '',
        ticket_id: doc.ticket_id || doc.reference || '',
        reference: doc.reference || doc.ticket_id,
        target_type: (doc.target_type || 'job') as AdminReportItem['target_type'],
        target_id: doc.target_id || '',
        target_title: doc.target_title || doc.title || 'Untitled',
        target_link: doc.target_link ?? null,
        reason: doc.reason || doc.reason_category || 'something_else',
        reason_category: doc.reason_category || doc.reason,
        title: doc.title || doc.target_title,
        description: doc.description || doc.statement,
        statement: doc.statement || doc.description,
        evidence_files: doc.evidence_files || [],
        status: (doc.status || 'pending') as AdminReportItem['status'],
        statusLabel: doc.statusLabel,
        submittedAt: doc.submittedAt || doc.createdAt,
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: doc.updatedAt || new Date().toISOString(),
        reviewer: doc.assigned_admin?.full_name || doc.assigned_admin?.email || null,
        assigned_admin: doc.assigned_admin,
        internal_notes: doc.internal_notes,
        message_to_reporter: doc.message_to_reporter,
        resolution_decision: doc.resolution_decision,
        action_taken: doc.action_taken,
      }));

      return {
        items,
        kpis: raw.kpis,
        page: raw.page ?? page,
        limit: raw.limit ?? limit,
        total: raw.total ?? items.length,
        totalPages: raw.totalPages ?? Math.max(1, Math.ceil((raw.total ?? items.length) / (raw.limit ?? limit))),
      };
    },
  });
}

// UC-36: Admin Report Investigation Detail
export function useAdminReportDetailQuery(ref: string) {
  return useQuery<AdminReportItem>({
    queryKey: reportsKeys.adminReportDetail(ref),
    queryFn: async () => {
      const res = await getApiV1ReportsById({
        path: { id: ref },
      });
      const data = unwrap(res, 'Unable to load report investigation detail');
      const doc = (data as unknown as { data?: Record<string, unknown> }).data || (data as Record<string, unknown>);

      return {
        id: (doc.id as string) || (doc._id as string) || '',
        ticket_id: (doc.ticket_id as string) || (doc.reference as string) || '',
        reference: (doc.reference as string) || (doc.ticket_id as string),
        target_type: (doc.target_type as AdminReportItem['target_type']) || 'job',
        target_id: (doc.target_id as string) || '',
        target_title: (doc.target_title as string) || (doc.title as string) || 'Untitled',
        target_link: (doc.target_link as string) ?? null,
        reason: (doc.reason as string) || (doc.reason_category as string) || 'something_else',
        reason_category: (doc.reason_category as string) || (doc.reason as string),
        title: (doc.title as string) || (doc.target_title as string),
        description: (doc.description as string) || (doc.statement as string) || '',
        statement: (doc.statement as string) || (doc.description as string) || '',
        evidence_files: (doc.evidence_files as string[]) || [],
        status: (doc.status as AdminReportItem['status']) || 'pending',
        statusLabel: doc.statusLabel as string | undefined,
        submittedAt: (doc.submittedAt as string) || (doc.createdAt as string),
        createdAt: (doc.createdAt as string) || new Date().toISOString(),
        updatedAt: (doc.updatedAt as string) || new Date().toISOString(),
        reviewer: ((doc.assigned_admin as { full_name?: string; email?: string })?.full_name ||
          (doc.assigned_admin as { email?: string })?.email) ?? null,
        assigned_admin: doc.assigned_admin as AdminReportItem['assigned_admin'],
        internal_notes: (doc.internal_notes as string) ?? null,
        message_to_reporter: (doc.message_to_reporter as string) ?? null,
        resolution_decision: (doc.resolution_decision as string) ?? null,
        action_taken: (doc.action_taken as string) ?? null,
      };
    },
    enabled: Boolean(ref),
  });
}

// UC-36: Claim Ticket
export function useClaimReportTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await patchApiV1ReportsByIdClaim({
        path: { id },
      });
      return unwrap(res, 'Unable to claim ticket');
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReportDetail(id) });
    },
  });
}

// UC-36: Resolve Ticket (Normal path: no enforcement -> action_taken: 'none')
export interface ResolveTicketPayload {
  id: string;
  decision: 'resolved' | 'rejected';
  internal_notes: string;
  message_to_reporter: string;
}

export function useResolveReportTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ResolveTicketPayload) => {
      const body: AdminResolveReportRequest = {
        decision: payload.decision,
        action_taken: payload.decision === 'resolved' ? 'none' : undefined,
        internal_notes: payload.internal_notes.trim(),
        message_to_reporter: payload.message_to_reporter.trim(),
      };

      const res = await patchApiV1ReportsByIdResolve({
        path: { id: payload.id },
        body,
      });
      return unwrap(res, 'Unable to finalize ticket');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
      queryClient.invalidateQueries({ queryKey: reportsKeys.adminReportDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
    },
  });
}
