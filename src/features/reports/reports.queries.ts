import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { client } from '@/api/client';
import {
  getApiV1MeReports,
  getApiV1MeReportsById,
  getApiV1Reports,
  getApiV1ReportsById,
  patchApiV1ReportsByIdClaim,
  patchApiV1ReportsByIdResolve,
  postApiV1MeReportsByIdHide,
  postApiV1MeReportsByIdWithdraw,
} from '@/api/generated/sdk.gen';
import type {
  AdminResolveReportRequest,
  PaginatedReportsResponse,
  PostApiV1MeReportsByIdWithdrawErrors,
  PostApiV1MeReportsByIdWithdrawResponses,
  ReportDetailResponse,
  ReportHideResponse,
  ReportWithdrawResponse,
} from '@/api/generated/types.gen';
import { unwrap } from '@/api/request-error';
import {
  REPORT_QUERY_KEYS,
  REPORT_STATUSES,
  type ReportStatus,
  type ReportTargetType,
} from '@/config/reports';
import {
  useSubmitReportMutation,
  type SubmitReportPayload,
} from '@/hooks/use-submit-report-mutation';

export { useSubmitReportMutation, type SubmitReportPayload };
import type {
  AdminBackendCategory,
  AdminBackendStatus,
  AdminBackendTargetType,
  AdminReportFileEntry,
  AdminReportItem,
  AdminReportTimelineEntry,
  AdminReportsQueryParams,
  PaginatedAdminReportsResult,
  ReporterReportsQueryParams,
} from './reports.types';

export const reportsKeys = {
  all: REPORT_QUERY_KEYS.all,
  myReports: () => [...REPORT_QUERY_KEYS.myReports] as const,
  myReportsLists: () => [...REPORT_QUERY_KEYS.myReports, 'list'] as const,
  myReportsList: (params: ReporterReportsQueryParams) => [...reportsKeys.myReportsLists(), params] as const,
  myReportDetail: (ref: string) => [...REPORT_QUERY_KEYS.myReports, 'detail', ref] as const,
  adminReports: () => [...REPORT_QUERY_KEYS.adminReports] as const,
  adminReportsList: (params: AdminReportsQueryParams) => [...REPORT_QUERY_KEYS.adminReports, 'list', params] as const,
  adminReportDetail: (ref: string) => [...REPORT_QUERY_KEYS.adminReports, 'detail', ref] as const,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

const LEGACY_REASON_MAP: Record<string, string> = {
  scam_fraud: 'scam_or_fraud',
  misleading_info: 'misleading_information',
  offensive_content: 'inappropriate_content',
  other: 'something_else',
};

function normalizeReasonCode(rawReason?: string): string {
  if (!rawReason) return 'something_else';
  return LEGACY_REASON_MAP[rawReason] ?? rawReason;
}

function normalizeTargetType(rawType?: string): ReportTargetType {
  if (rawType === 'company' || rawType === 'enterprise') return 'company';
  if (rawType === 'user') return 'user';
  return 'job';
}

function normalizeAdminBackendTargetType(rawType?: string): AdminBackendTargetType {
  if (rawType === 'job') return 'job';
  if (rawType === 'company' || rawType === 'enterprise') return 'company';
  if (rawType === 'user') return 'user';
  return 'all';
}

function isReportStatus(value?: string): value is ReportStatus {
  return Boolean(value && (REPORT_STATUSES as readonly string[]).includes(value));
}

const VALID_ADMIN_BACKEND_STATUSES: readonly AdminBackendStatus[] = [
  'all',
  'open',
  'closed',
  'pending',
  'reviewing',
  'resolved',
  'rejected',
  'withdrawn',
];

function normalizeAdminBackendStatus(statusParam?: string): AdminBackendStatus {
  if (!statusParam) return 'open';
  if ((VALID_ADMIN_BACKEND_STATUSES as readonly string[]).includes(statusParam)) {
    return statusParam as AdminBackendStatus;
  }
  return 'open';
}

const VALID_ADMIN_BACKEND_CATEGORIES: readonly AdminBackendCategory[] = [
  'all',
  'scam_fraud',
  'fee_extortion',
  'misleading_info',
  'offensive_content',
  'impersonation',
  'harassment',
  'other',
  'scam_or_fraud',
  'misleading_information',
  'discrimination',
  'inappropriate_content',
  'something_else',
];

function normalizeAdminBackendCategory(categoryParam?: string): AdminBackendCategory {
  if (!categoryParam || categoryParam === 'all') return 'all';
  if ((VALID_ADMIN_BACKEND_CATEGORIES as readonly string[]).includes(categoryParam)) {
    return categoryParam as AdminBackendCategory;
  }
  return 'all';
}

function parseAdminReportItem(raw: unknown): AdminReportItem {
  const doc = isRecord(raw) ? raw : {};

  const rawReason = asString(doc.reason) || asString(doc.reason_category);
  const normalizedReason = normalizeReasonCode(rawReason);

  const filesList: AdminReportFileEntry[] = [];
  if (Array.isArray(doc.files)) {
    for (const entry of doc.files) {
      if (isRecord(entry) && typeof entry.downloadUrl === 'string' && entry.downloadUrl) {
        filesList.push({
          id: asString(entry.id) || entry.downloadUrl,
          fileName: asString(entry.fileName) || entry.downloadUrl,
          mimeType: asString(entry.mimeType),
          size: asNumber(entry.size),
          downloadUrl: entry.downloadUrl,
        });
      }
    }
  }
  if (filesList.length === 0 && Array.isArray(doc.evidence_files)) {
    for (const entry of doc.evidence_files) {
      if (isRecord(entry) && typeof entry.file_url === 'string' && entry.file_url) {
        filesList.push({
          id: asString(entry.id) || asString(entry._id) || asString(entry.storage_key) || entry.file_url,
          fileName: asString(entry.file_name) || asString(entry.fileName) || entry.file_url,
          mimeType: asString(entry.mime_type) || asString(entry.mimeType),
          size: asNumber(entry.size),
          downloadUrl: entry.file_url,
        });
      }
    }
  }

  const evidenceList: string[] = [];
  if (Array.isArray(doc.evidence_files)) {
    for (const entry of doc.evidence_files) {
      if (typeof entry === 'string' && entry) {
        evidenceList.push(entry);
      } else if (isRecord(entry) && typeof entry.file_url === 'string' && entry.file_url) {
        evidenceList.push(entry.file_url);
      }
    }
  }

  let assignedAdmin: AdminReportItem['assigned_admin'] = null;
  if (isRecord(doc.assigned_admin)) {
    const adminId = asString(doc.assigned_admin.id) || asString(doc.assigned_admin._id) || '';
    const adminEmail = asString(doc.assigned_admin.email) || '';
    const adminFullName = asNullableString(doc.assigned_admin.full_name);
    if (adminId || adminEmail || adminFullName) {
      assignedAdmin = {
        id: adminId,
        email: adminEmail,
        full_name: adminFullName,
      };
    }
  }

  const timeline: AdminReportTimelineEntry[] = [];
  if (Array.isArray(doc.timeline)) {
    for (const item of doc.timeline) {
      if (isRecord(item) && typeof item.status === 'string') {
        timeline.push({
          status: item.status,
          timestamp: asString(item.timestamp) || asString(doc.updatedAt) || '',
          note: asNullableString(item.note),
        });
      }
    }
  }

  const rawStatus = asString(doc.status);
  const status: ReportStatus = isReportStatus(rawStatus) ? rawStatus : 'pending';
  const createdAt = asString(doc.createdAt) || asString(doc.submittedAt) || new Date().toISOString();
  const updatedAt = asString(doc.updatedAt) || createdAt;
  const ticketId = asString(doc.ticket_id) || asString(doc.reference) || '';
  const reference = asString(doc.reference) || ticketId;
  const directReviewer = asString(doc.reviewer);

  return {
    id: asString(doc.id) || asString(doc._id) || '',
    ticket_id: ticketId,
    reference,
    target_type: normalizeTargetType(asString(doc.target_type)),
    target_id: asString(doc.target_id) || '',
    target_title: asString(doc.target_title) || asString(doc.title) || 'Untitled',
    target_link: asNullableString(doc.target_link),
    reason: normalizedReason,
    reason_category: asString(doc.reason_category) || rawReason,
    title: asString(doc.title) || asString(doc.target_title),
    description: asString(doc.description) || asString(doc.statement) || '',
    statement: asString(doc.statement) || asString(doc.description) || '',
    evidence_files: evidenceList,
    files: filesList.length > 0 ? filesList : undefined,
    status,
    statusLabel: asString(doc.statusLabel),
    submittedAt: asString(doc.submittedAt) || createdAt,
    createdAt,
    updatedAt,
    reviewed_at: asNullableString(doc.reviewed_at),
    resolved_at: asNullableString(doc.resolved_at),
    withdrawn_at: asNullableString(doc.withdrawn_at),
    withdrawal_reason: asNullableString(doc.withdrawal_reason),
    reviewer: directReviewer || assignedAdmin?.full_name || assignedAdmin?.email || null,
    assigned_admin: assignedAdmin,
    internal_notes: asNullableString(doc.internal_notes),
    message_to_reporter: asNullableString(doc.message_to_reporter),
    resolution_decision: asNullableString(doc.resolution_decision),
    action_taken: asNullableString(doc.action_taken),
    timeline,
  };
}

function parseKpis(rawKpis: unknown): PaginatedAdminReportsResult['kpis'] {
  if (!isRecord(rawKpis)) return undefined;
  return {
    total: asNumber(rawKpis.total) ?? 0,
    pending: asNumber(rawKpis.pending) ?? 0,
    reviewing: asNumber(rawKpis.reviewing) ?? 0,
    resolved: asNumber(rawKpis.resolved) ?? 0,
    rejected: asNumber(rawKpis.rejected) ?? 0,
    withdrawn: asNumber(rawKpis.withdrawn) ?? 0,
  };
}

function parsePaginatedAdminReports(
  raw: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): PaginatedAdminReportsResult {
  const container = isRecord(raw) ? raw : {};
  const rawItems = Array.isArray(container.items) ? container.items : [];
  const items = rawItems.map((entry) => parseAdminReportItem(entry));
  const resolvedLimit = asNumber(container.limit) ?? fallbackLimit;
  const total = asNumber(container.total) ?? items.length;
  const totalPages =
    asNumber(container.totalPages) ?? Math.max(1, Math.ceil(total / Math.max(1, resolvedLimit)));

  return {
    items,
    kpis: parseKpis(container.kpis),
    page: asNumber(container.page) ?? fallbackPage,
    limit: resolvedLimit,
    total,
    totalPages,
  };
}

function matchesSubmittedFilter(item: AdminReportItem, submittedFilter: string): boolean {
  if (!submittedFilter || submittedFilter === 'all') return true;
  const iso = item.submittedAt || item.createdAt;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return true;

  const now = new Date();
  if (submittedFilter === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return ts >= startOfToday;
  }
  if (submittedFilter === '7d') {
    return ts >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
  }
  if (submittedFilter === '30d') {
    return ts >= now.getTime() - 30 * 24 * 60 * 60 * 1000;
  }
  return true;
}

const MAX_ADMIN_BATCH_LIMIT = 100;
const MAX_ADMIN_BATCH_PAGES = 5;

async function fetchAdminQueryPages(options: {
  status: AdminBackendStatus;
  targetType: AdminBackendTargetType;
  category: AdminBackendCategory;
  search?: string;
  batchLimit: number;
}): Promise<{
  items: AdminReportItem[];
  total: number;
  kpis?: PaginatedAdminReportsResult['kpis'];
}> {
  const { status, targetType, category, search, batchLimit } = options;

  const firstRes = await getApiV1Reports({
    query: {
      page: 1,
      limit: batchLimit,
      status,
      target_type: targetType,
      category,
      search,
    },
  });
  const firstData = parsePaginatedAdminReports(
    unwrap(firstRes, 'Unable to load admin report queue'),
    1,
    batchLimit,
  );

  const targetPages = Math.min(firstData.totalPages, MAX_ADMIN_BATCH_PAGES);
  if (targetPages <= 1) {
    return {
      items: firstData.items,
      total: firstData.total,
      kpis: firstData.kpis,
    };
  }

  const extraPageNumbers: number[] = [];
  for (let p = 2; p <= targetPages; p += 1) {
    extraPageNumbers.push(p);
  }

  const extraPages = await Promise.all(
    extraPageNumbers.map(async (p) => {
      const res = await getApiV1Reports({
        query: {
          page: p,
          limit: batchLimit,
          status,
          target_type: targetType,
          category,
          search,
        },
      });
      return parsePaginatedAdminReports(
        unwrap(res, 'Unable to load admin report queue'),
        p,
        batchLimit,
      );
    }),
  );

  const combined = [...firstData.items];
  for (const pageResult of extraPages) {
    combined.push(...pageResult.items);
  }

  return {
    items: combined,
    total: firstData.total,
    kpis: firstData.kpis,
  };
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
      const trimmedNote = note?.trim();
      if (trimmedNote) {
        const res = await client.post<
          PostApiV1MeReportsByIdWithdrawResponses,
          PostApiV1MeReportsByIdWithdrawErrors
        >({
          security: [{ scheme: 'bearer', type: 'http' }],
          url: '/api/v1/me/reports/{id}/withdraw',
          path: { id },
          body: { note: trimmedNote },
          headers: { 'Content-Type': 'application/json' },
        });
        return unwrap(res, 'Unable to withdraw report');
      }

      const res = await postApiV1MeReportsByIdWithdraw({
        path: { id },
      });
      return unwrap(res, 'Unable to withdraw report');
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
      void queryClient.invalidateQueries({ queryKey: reportsKeys.myReportDetail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportsKeys.myReportsLists() });
    },
  });
}

// UC-35: Admin Reports Queue
export function useAdminReportsQuery(params: AdminReportsQueryParams = {}) {
  const {
    page = 1,
    limit = 10,
    status = 'open',
    target_type = 'all',
    category = 'all',
    submitted = 'all',
    search,
  } = params;

  return useQuery<PaginatedAdminReportsResult>({
    queryKey: reportsKeys.adminReportsList({
      page,
      limit,
      status,
      target_type,
      category,
      submitted,
      search,
    }),
    queryFn: async () => {
      const normalizedStatus = normalizeAdminBackendStatus(status);
      const normalizedTargetType = normalizeAdminBackendTargetType(target_type);
      const normalizedCategory = normalizeAdminBackendCategory(category);
      const trimmedSearch = search?.trim() || undefined;
      const hasDateWindowFilter = Boolean(submitted) && submitted !== 'all';

      // 1. Single direct request whenever no client-side date window filter is active (default 99% path)
      if (!hasDateWindowFilter) {
        const res = await getApiV1Reports({
          query: {
            page,
            limit,
            status: normalizedStatus,
            target_type: normalizedTargetType,
            category: normalizedCategory,
            search: trimmedSearch,
          },
        });
        const data = unwrap(res, 'Unable to load admin report queue');
        return parsePaginatedAdminReports(data, page, limit);
      }

      // 2. Date window filter ('today' | '7d' | '30d') not yet supported natively as a query param on BE.
      // Query up to MAX_ADMIN_BATCH_PAGES of this single status/category stream and filter client-side.
      const queryResult = await fetchAdminQueryPages({
        status: normalizedStatus,
        targetType: normalizedTargetType,
        category: normalizedCategory,
        search: trimmedSearch,
        batchLimit: MAX_ADMIN_BATCH_LIMIT,
      });

      const filteredItems = queryResult.items.filter((item) =>
        matchesSubmittedFilter(item, submitted),
      );

      const total = filteredItems.length;
      const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
      const startIndex = (page - 1) * limit;
      const pagedItems = filteredItems.slice(startIndex, startIndex + limit);

      return {
        items: pagedItems,
        kpis: queryResult.kpis,
        page,
        limit,
        total,
        totalPages,
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
      const raw = unwrap(res, 'Unable to load report investigation detail');
      const unwrappedDoc = isRecord(raw) && isRecord(raw.data) ? raw.data : raw;
      return parseAdminReportItem(unwrappedDoc);
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
      void queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
      void queryClient.invalidateQueries({ queryKey: reportsKeys.adminReportDetail(id) });
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
      void queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
      void queryClient.invalidateQueries({ queryKey: reportsKeys.adminReportDetail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
    },
  });
}
