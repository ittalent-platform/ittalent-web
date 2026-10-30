import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { client } from '@/api/client';
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
  CreateReportResponse,
  PaginatedReportsResponse,
  PostApiV1MeReportsByIdWithdrawErrors,
  PostApiV1MeReportsByIdWithdrawResponses,
  PostApiV1MeReportsErrors,
  PostApiV1MeReportsResponses,
  ReportDetailResponse,
  ReportHideResponse,
  ReportWithdrawResponse,
} from '@/api/generated/types.gen';
import { unwrap } from '@/api/request-error';
import {
  REPORT_STATUSES,
  normalizeEvidenceFileForUpload,
  type ReportStatus,
  type ReportTargetType,
} from '@/config/reports';
import type {
  AdminBackendStatus,
  AdminBackendTargetType,
  AdminReportItem,
  AdminReportTimelineEntry,
  AdminReportsQueryParams,
  PaginatedAdminReportsResult,
  ReporterReportsQueryParams,
} from './reports.types';

export const reportsKeys = {
  all: ['reports'] as const,
  myReports: () => [...reportsKeys.all, 'mine'] as const,
  myReportsLists: () => [...reportsKeys.myReports(), 'list'] as const,
  myReportsList: (params: ReporterReportsQueryParams) => [...reportsKeys.myReportsLists(), params] as const,
  myReportDetail: (ref: string) => [...reportsKeys.myReports(), 'detail', ref] as const,
  adminReports: () => [...reportsKeys.all, 'admin'] as const,
  adminReportsList: (params: AdminReportsQueryParams) => [...reportsKeys.adminReports(), 'list', params] as const,
  adminReportDetail: (ref: string) => [...reportsKeys.adminReports(), 'detail', ref] as const,
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

function resolveBackendStatuses(statusParam?: string): readonly AdminBackendStatus[] {
  if (!statusParam || statusParam === 'open') {
    return ['pending', 'reviewing'];
  }
  if (statusParam === 'closed') {
    return ['resolved', 'rejected', 'withdrawn'];
  }
  if (
    statusParam === 'all' ||
    statusParam === 'pending' ||
    statusParam === 'reviewing' ||
    statusParam === 'resolved' ||
    statusParam === 'rejected' ||
    statusParam === 'withdrawn'
  ) {
    return [statusParam];
  }
  return ['pending', 'reviewing'];
}

function parseAdminReportItem(raw: unknown): AdminReportItem {
  const doc = isRecord(raw) ? raw : {};

  const rawReason = asString(doc.reason) || asString(doc.reason_category);
  const normalizedReason = normalizeReasonCode(rawReason);

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

function matchesCategoryFilter(item: AdminReportItem, categoryFilter: string): boolean {
  if (!categoryFilter || categoryFilter === 'all') return true;
  const normalizedTarget = normalizeReasonCode(categoryFilter);
  return (
    normalizeReasonCode(item.reason) === normalizedTarget ||
    normalizeReasonCode(item.reason_category) === normalizedTarget
  );
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

async function fetchAdminStatusItems(options: {
  status: AdminBackendStatus;
  targetType: AdminBackendTargetType;
  search?: string;
  batchLimit: number;
  fetchAllPages: boolean;
  requiredCount: number;
}): Promise<{
  items: AdminReportItem[];
  total: number;
  kpis?: PaginatedAdminReportsResult['kpis'];
  complete: boolean;
}> {
  const { status, targetType, search, batchLimit, fetchAllPages, requiredCount } = options;

  const firstRes = await getApiV1Reports({
    query: {
      page: 1,
      limit: batchLimit,
      status,
      target_type: targetType,
      category: 'all',
      search,
    },
  });
  const firstData = parsePaginatedAdminReports(
    unwrap(firstRes, 'Unable to load admin report queue'),
    1,
    batchLimit,
  );

  const targetPages = fetchAllPages
    ? Math.min(firstData.totalPages, MAX_ADMIN_BATCH_PAGES)
    : Math.min(
        firstData.totalPages,
        MAX_ADMIN_BATCH_PAGES,
        Math.max(1, Math.ceil(requiredCount / batchLimit)),
      );

  if (targetPages <= 1) {
    return {
      items: firstData.items,
      total: firstData.total,
      kpis: firstData.kpis,
      complete: firstData.totalPages <= 1,
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
          category: 'all',
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
    complete: targetPages >= firstData.totalPages,
  };
}

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
          formData.append('files', normalizeEvidenceFileForUpload(file));
        }

        const res = await client.post<PostApiV1MeReportsResponses, PostApiV1MeReportsErrors>({
          security: [{ scheme: 'bearer', type: 'http' }],
          url: '/api/v1/me/reports',
          body: formData,
          bodySerializer: null,
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
      void queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
      void queryClient.invalidateQueries({ queryKey: reportsKeys.adminReports() });
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
      const backendStatuses = resolveBackendStatuses(status);
      const normalizedTargetType = normalizeAdminBackendTargetType(target_type);
      const trimmedSearch = search?.trim() || undefined;
      const hasClientFilter =
        (Boolean(category) && category !== 'all') ||
        (Boolean(submitted) && submitted !== 'all');

      // Direct single-endpoint pagination when BE supports the exact filter natively
      if (backendStatuses.length === 1 && !hasClientFilter) {
        const res = await getApiV1Reports({
          query: {
            page,
            limit,
            status: backendStatuses[0],
            target_type: normalizedTargetType,
            category: 'all',
            search: trimmedSearch,
          },
        });
        const data = unwrap(res, 'Unable to load admin report queue');
        return parsePaginatedAdminReports(data, page, limit);
      }

      // Composite status ('open' -> pending + reviewing, 'closed' -> resolved + rejected + withdrawn)
      // or client-refined filters (5 candidate reason codes / submitted date window).
      const requiredCount = page * limit;
      const batchLimit = hasClientFilter
        ? MAX_ADMIN_BATCH_LIMIT
        : Math.min(MAX_ADMIN_BATCH_LIMIT, Math.max(50, requiredCount));

      const statusResults = await Promise.all(
        backendStatuses.map((beStatus) =>
          fetchAdminStatusItems({
            status: beStatus,
            targetType: normalizedTargetType,
            search: trimmedSearch,
            batchLimit,
            fetchAllPages: hasClientFilter,
            requiredCount,
          }),
        ),
      );

      const seenIds = new Set<string>();
      const mergedItems: AdminReportItem[] = [];
      let sumBackendTotals = 0;
      let allComplete = true;
      let kpis: PaginatedAdminReportsResult['kpis'];

      for (const result of statusResults) {
        sumBackendTotals += result.total;
        if (!result.complete) {
          allComplete = false;
        }
        if (!kpis && result.kpis) {
          kpis = result.kpis;
        }
        for (const item of result.items) {
          const dedupeKey = item.id || item.reference || item.ticket_id;
          if (dedupeKey && seenIds.has(dedupeKey)) continue;
          if (dedupeKey) seenIds.add(dedupeKey);
          mergedItems.push(item);
        }
      }

      mergedItems.sort((a, b) => {
        const tsB = Date.parse(b.submittedAt || b.createdAt) || 0;
        const tsA = Date.parse(a.submittedAt || a.createdAt) || 0;
        return tsB - tsA;
      });

      const filteredItems = hasClientFilter
        ? mergedItems.filter(
            (item) =>
              matchesCategoryFilter(item, category) &&
              matchesSubmittedFilter(item, submitted),
          )
        : mergedItems;

      const total = hasClientFilter
        ? filteredItems.length
        : allComplete
          ? filteredItems.length
          : sumBackendTotals;

      const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
      const startIndex = (page - 1) * limit;
      const pagedItems = filteredItems.slice(startIndex, startIndex + limit);

      return {
        items: pagedItems,
        kpis,
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
