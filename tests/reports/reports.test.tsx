import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { client } from '@/api/client';
import * as sdk from '@/api/generated/sdk.gen';
import { ReportViolationDialog } from '@/components/common/report-violation-dialog';
import { AdminReportDetailPage } from '@/features/reports/pages/admin-report-detail-page';
import { AdminReportsPage } from '@/features/reports/pages/admin-reports-page';
import { MyReportDetailPage } from '@/features/reports/pages/my-report-detail-page';
import { MyReportsPage } from '@/features/reports/pages/my-reports-page';
import { useSubmitReportMutation } from '@/features/reports/reports.queries';

const mockUseSession = vi.fn();
vi.mock('@/auth/use-session', () => ({
  useSession: () => mockUseSession(),
}));

const mockFetch = vi.fn<typeof fetch>();

vi.mock('@/api/generated/sdk.gen', () => ({
  postApiV1MeReports: vi.fn(),
  getApiV1MeReports: vi.fn(),
  getApiV1MeReportsById: vi.fn(),
  postApiV1MeReportsByIdWithdraw: vi.fn(),
  postApiV1MeReportsByIdHide: vi.fn(),
  getApiV1Reports: vi.fn(),
  getApiV1ReportsById: vi.fn(),
  patchApiV1ReportsByIdClaim: vi.fn(),
  patchApiV1ReportsByIdResolve: vi.fn(),
}));

const VALID_ADMIN_STATUSES = new Set([
  'all',
  'open',
  'closed',
  'pending',
  'reviewing',
  'resolved',
  'rejected',
  'withdrawn',
]);
const VALID_ADMIN_TARGET_TYPES = new Set(['all', 'job', 'company', 'user']);
const VALID_ADMIN_CATEGORIES = new Set([
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
]);

describe('Reports Feature Contract & E2E Alignment Tests', () => {
  let queryClient: QueryClient;

  function createWrapper(initialEntries = ['/']) {
    return ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    client.setConfig({
      baseUrl: 'http://localhost:3000',
      fetch: mockFetch,
    });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'usr_1',
          role: 'user',
          email: 'candidate@example.com',
          emailVerified: true,
        },
      },
      isPending: false,
    });
  });

  describe('UC-30: Report Submission (Job, Company, Validation & Roles)', () => {
    it('shows "Sign in to report" dialog when user is not authenticated (Design E1)', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });

      render(
        <ReportViolationDialog
          open={true}
          onOpenChange={vi.fn()}
          targetType="job"
          targetId="job_123"
          targetTitle="Frontend Engineer"
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText(/Sign in to report/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    });

    it('shows "Candidate account required" dialog for signed-in non-candidate roles (Section 5)', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'rec_1', role: 'recruiter', email: 'recruiter@techcorp.com' },
        },
        isPending: false,
      });

      render(
        <ReportViolationDialog
          open={true}
          onOpenChange={vi.fn()}
          targetType="job"
          targetId="job_123"
          targetTitle="Frontend Engineer"
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText(/Candidate account required/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Send report/i })).toBeNull();
    });

    it('displays both reason and statement validation errors when submitted empty (Section 4.1)', () => {
      render(
        <ReportViolationDialog
          open={true}
          onOpenChange={vi.fn()}
          targetType="job"
          targetId="job_123"
          targetTitle="Frontend Engineer"
          targetSubtitle="Job · Nova Fintech"
        />,
        { wrapper: createWrapper() },
      );

      // Deduplicates "Job · Nova Fintech" instead of "Job · Job · Nova Fintech"
      expect(screen.getByText('Job · Nova Fintech')).toBeInTheDocument();
      expect(screen.queryByText('Job · Job · Nova Fintech')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: /Send report/i }));

      expect(screen.getByText(/Choose what’s wrong\./i)).toBeInTheDocument();
      expect(screen.getByText(/Tell us what happened\./i)).toBeInTheDocument();
      expect(sdk.postApiV1MeReports).not.toHaveBeenCalled();
    });

    it('refuses unsupported .exe files immediately on selection while sending multipart FormData without Content-Type: application/json (Section 1 & Design E4)', async () => {
      const postSpy = vi.spyOn(client, 'post');
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            reference: 'RPT-2026-0099',
            message: 'Report received. You can follow it in My reports.',
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      render(
        <ReportViolationDialog
          open={true}
          onOpenChange={vi.fn()}
          targetType="job"
          targetId="job_123"
          targetTitle="Frontend Engineer"
        />,
        { wrapper: createWrapper() },
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const badExe = new File(['MZ-binary'], 'recording.exe', {
        type: 'application/x-msdownload',
      });
      const goodPdf = new File(['%PDF-1.4'], 'call-notes.pdf', {
        type: 'application/pdf',
      });

      fireEvent.change(fileInput, {
        target: { files: [badExe, goodPdf] },
      });

      expect(
        screen.getByText(/recording\.exe can’t be added\. Use a screenshot or a document\./i),
      ).toBeInTheDocument();
      expect(screen.getByText('call-notes.pdf')).toBeInTheDocument();
      expect(screen.queryByText('recording.exe')).toBeNull();

      // Completing form submits multipart FormData containing only the valid PDF
      fireEvent.click(screen.getByRole('radio', { name: /Scam or fraud/i }));
      fireEvent.change(
        screen.getByPlaceholderText(/Describe what’s misleading, fraudulent or inaccurate/i),
        { target: { value: 'Recruiter requested an upfront fee.' } },
      );
      fireEvent.click(screen.getByRole('button', { name: /Send report/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const submittedForm = postSpy.mock.calls[0]?.[0]?.body as FormData;
      expect(submittedForm).toBeInstanceOf(FormData);
      const uploadedFiles = submittedForm.getAll('files') as File[];
      expect(uploadedFiles).toHaveLength(1);
      expect(uploadedFiles[0]?.name).toBe('call-notes.pdf');

      const outgoingRequest = mockFetch.mock.calls[0]?.[0];
      expect(outgoingRequest).toBeInstanceOf(Request);
      const req = outgoingRequest as Request;
      const contentTypeHeader = req.headers.get('content-type') ?? '';
      expect(contentTypeHeader.toLowerCase()).not.toContain('application/json');
      expect(contentTypeHeader.toLowerCase()).toMatch(/^multipart\/form-data;\s*boundary=/);

      const rawMultipartBody = await req.text();
      expect(rawMultipartBody).toContain('Content-Disposition: form-data; name="targetType"');
      expect(rawMultipartBody).toContain('job_123');
      expect(rawMultipartBody).toContain('scam_or_fraud');
      expect(rawMultipartBody).toContain('Content-Type: application/pdf');

      await waitFor(() => {
        expect(screen.getByText(/RPT-2026-0099/i)).toBeInTheDocument();
      });
    });

    it('sends multipart request without Content-Type: application/json in useSubmitReportMutation when files are attached (Section 1)', async () => {
      const postSpy = vi.spyOn(client, 'post');
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            reference: 'RPT-2026-0100',
            message: 'Report received. You can follow it in My reports.',
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      const { result } = renderHook(() => useSubmitReportMutation(), {
        wrapper: createWrapper(),
      });

      const pngFile = new File(['png-bytes'], 'evidence.png', { type: 'image/png' });
      const res = await result.current.mutateAsync({
        targetType: 'job',
        targetId: 'job_123',
        reason: 'scam_or_fraud',
        statement: 'Fraudulent job fee demand.',
        idempotencyKey: 'idem-multipart-1',
        files: [pngFile],
      });

      expect(res.reference).toBe('RPT-2026-0100');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const submittedForm = postSpy.mock.calls[0]?.[0]?.body as FormData;
      const uploadedFiles = submittedForm.getAll('files') as File[];
      expect(uploadedFiles).toHaveLength(1);
      expect(uploadedFiles[0]?.name).toBe('evidence.png');

      const req = mockFetch.mock.calls[0]?.[0] as Request;
      expect(req).toBeInstanceOf(Request);
      const contentTypeHeader = req.headers.get('content-type') ?? '';
      expect(contentTypeHeader.toLowerCase()).not.toContain('application/json');
      expect(contentTypeHeader.toLowerCase()).toMatch(/^multipart\/form-data;\s*boundary=/);

      const rawMultipartBody = await req.text();
      expect(rawMultipartBody).toContain('Content-Disposition: form-data; name="files"');
      expect(rawMultipartBody).toContain('Content-Type: image/png');
      expect(rawMultipartBody).toContain('idem-multipart-1');
    });

    it('submits valid job report using POST /api/v1/me/reports without target_link or legacy fields (B1, B2)', async () => {
      vi.mocked(sdk.postApiV1MeReports).mockResolvedValueOnce({
        data: {
          reference: 'RPT-2026-0001',
          message: 'Report received. You can follow it in My reports.',
        },
        error: undefined,
        request: new Request('http://localhost/api/v1/me/reports'),
        response: new Response(null, { status: 201 }),
      });

      render(
        <ReportViolationDialog
          open={true}
          onOpenChange={vi.fn()}
          targetType="job"
          targetId="job_123"
          targetTitle="Frontend Engineer"
          targetSubtitle="TechCorp"
        />,
        { wrapper: createWrapper() },
      );

      fireEvent.click(screen.getByRole('radio', { name: /Scam or fraud/i }));
      fireEvent.change(
        screen.getByPlaceholderText(/Describe what’s misleading, fraudulent or inaccurate/i),
        {
          target: {
            value: 'This job posting demands payment upfront before an interview.',
          },
        },
      );
      fireEvent.click(screen.getByRole('button', { name: /Send report/i }));

      await waitFor(() => {
        expect(sdk.postApiV1MeReports).toHaveBeenCalledTimes(1);
      });

      const callArgs = vi.mocked(sdk.postApiV1MeReports).mock.calls[0]?.[0];
      const body = callArgs?.body as Record<string, unknown>;

      expect(body.targetType).toBe('job');
      expect(body.targetId).toBe('job_123');
      expect(body.reason).toBe('scam_or_fraud');
      expect(body.statement).toBe(
        'This job posting demands payment upfront before an interview.',
      );
      expect(body.idempotencyKey).toBeDefined();
      expect(body.target_link).toBeUndefined();
      expect(body.reason_category).toBeUndefined();
      expect(body.is_anonymous).toBeUndefined();

      await waitFor(() => {
        expect(screen.getByText(/Report received/i)).toBeInTheDocument();
        expect(screen.getByText(/RPT-2026-0001/i)).toBeInTheDocument();
      });
    });

    it('submits valid company report with targetType="company" when passed targetType="enterprise" (B2)', async () => {
      vi.mocked(sdk.postApiV1MeReports).mockResolvedValueOnce({
        data: {
          reference: 'RPT-2026-0002',
          message: 'Report received. You can follow it in My reports.',
        },
        error: undefined,
        request: new Request('http://localhost/api/v1/me/reports'),
        response: new Response(null, { status: 201 }),
      });

      render(
        <ReportViolationDialog
          open={true}
          onOpenChange={vi.fn()}
          targetType="enterprise"
          targetId="ent_456"
          targetTitle="Nimbus Pay"
        />,
        { wrapper: createWrapper() },
      );

      fireEvent.click(screen.getByRole('radio', { name: /Misleading information/i }));
      fireEvent.change(
        screen.getByPlaceholderText(/Describe what’s misleading, fraudulent or inaccurate/i),
        { target: { value: 'Fake company registration info.' } },
      );
      fireEvent.click(screen.getByRole('button', { name: /Send report/i }));

      await waitFor(() => {
        expect(sdk.postApiV1MeReports).toHaveBeenCalledTimes(1);
      });

      const callArgs = vi.mocked(sdk.postApiV1MeReports).mock.calls[0]?.[0];
      expect(callArgs?.body?.targetType).toBe('company');
    });
  });

  describe('UC-31 & UC-32: Candidate My Reports & Detail (Deduplication & Withdrawn History)', () => {
    it('queries GET /api/v1/me/reports with status="all"|"open"|"closed" and deduplicates target subtitles (B3, Section 3.2)', async () => {
      vi.mocked(sdk.getApiV1MeReports).mockResolvedValue({
        data: {
          items: [
            {
              id: 'rep_1',
              reference: 'RPT-2026-0001',
              target: {
                type: 'job',
                id: 'job_1',
                title: 'Senior Go Engineer',
                subtitle: 'Job · Nova Fintech',
                isAvailable: true,
              },
              reason: 'scam_or_fraud',
              reasonLabel: 'Scam or fraud',
              status: 'pending',
              statusLabel: 'Pending',
              submittedAt: '2026-10-27T10:00:00.000Z',
            },
            {
              id: 'rep_2',
              reference: 'RPT-2026-0002',
              target: {
                type: 'company',
                id: 'ent_1',
                title: 'Nova Fintech',
                subtitle: 'Company',
                isAvailable: true,
              },
              reason: 'misleading_information',
              reasonLabel: 'Misleading information',
              status: 'pending',
              statusLabel: 'Pending',
              submittedAt: '2026-10-28T10:00:00.000Z',
            },
          ],
          counts: { all: 5, open: 2, closed: 3 },
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
        error: undefined,
        request: new Request('http://localhost/api/v1/me/reports'),
        response: new Response(null, { status: 200 }),
      });

      render(<MyReportsPage />, { wrapper: createWrapper(['/my-reports?tab=open']) });

      await waitFor(() => {
        expect(screen.getByText('Senior Go Engineer')).toBeInTheDocument();
      });

      // Assert target subtitles are NOT duplicated (Section 3.2)
      expect(screen.getByText('Job · Nova Fintech')).toBeInTheDocument();
      expect(screen.queryByText('Job · Job · Nova Fintech')).toBeNull();
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.queryByText('Company · Company')).toBeNull();

      // Mapped reason labels
      expect(screen.getByText('Scam or fraud')).toBeInTheDocument();
      expect(screen.getByText('Misleading information')).toBeInTheDocument();

      const firstCall = vi.mocked(sdk.getApiV1MeReports).mock.calls[0]?.[0];
      expect(firstCall?.query?.status).toBe('open');

      fireEvent.click(screen.getByRole('tab', { name: /Closed/i }));

      await waitFor(() => {
        const lastCall = vi.mocked(sdk.getApiV1MeReports).mock.calls.at(-1)?.[0];
        expect(lastCall?.query?.status).toBe('closed');
      });
    });

    it('renders Withdrawn report detail without spurious "Under review" history step and cleans duplicate file extensions (Section 4.2, 4.3)', async () => {
      vi.mocked(sdk.getApiV1MeReportsById).mockResolvedValueOnce({
        data: {
          id: 'rep_3',
          reference: 'RPT-2026-0003',
          status: 'withdrawn',
          statusLabel: 'Withdrawn',
          statusDescription: 'You withdrew it. This report is closed.',
          submittedAt: '2026-10-27T10:00:00.000Z',
          target: {
            type: 'job',
            id: 'job_9',
            title: 'Platform Architect',
            subtitle: 'Job · Nova Fintech',
            isAvailable: true,
          },
          reason: 'scam_or_fraud',
          reasonLabel: 'Scam or fraud',
          statement: 'Suspicious interview request.',
          files: [
            {
              id: 'file_1',
              fileName: 'evidence-abc123.png.png',
              mimeType: 'image/png',
              size: 12040,
              downloadUrl: 'https://res.cloudinary.com/demo/image/upload/evidence-abc123.png.png',
            },
          ],
          responseFromPlatform: null,
          history: [
            {
              event: 'submitted',
              label: 'Submitted',
              timestamp: '2026-10-27T10:00:00.000Z',
            },
            {
              event: 'withdrawn',
              label: 'Withdrawn by you',
              timestamp: '2026-10-27T10:15:00.000Z',
            },
          ],
          canWithdraw: false,
          canHide: true,
        },
        error: undefined,
        request: new Request('http://localhost/api/v1/me/reports/RPT-2026-0003'),
        response: new Response(null, { status: 200 }),
      });

      render(
        <Routes>
          <Route path="/my-reports/:ref" element={<MyReportDetailPage />} />
        </Routes>,
        { wrapper: createWrapper(['/my-reports/RPT-2026-0003']) },
      );

      await waitFor(() => {
        expect(screen.getByText(/You withdrew it/i)).toBeInTheDocument();
      });

      expect(screen.getByText('Submitted')).toBeInTheDocument();
      expect(screen.getByText('Withdrawn by you')).toBeInTheDocument();
      expect(screen.queryByText(/Under review/i)).toBeNull();
      expect(screen.queryByText(/Review started/i)).toBeNull();

      // Cleaned filename without .png.png and honest link caption
      expect(screen.getByText('evidence-abc123.png')).toBeInTheDocument();
      expect(screen.queryByText('evidence-abc123.png.png')).toBeNull();
      expect(screen.queryByText(/private, short-lived link/i)).toBeNull();
    });
  });

  describe('UC-35 & UC-36: Admin Queue Strict BE Contract & Investigation Detail', () => {
    function installStrictBackendAdminMock() {
      const sampleRecords = [
        {
          id: 'rep_pending_1',
          ticket_id: 'RPT-2026-0010',
          reference: 'RPT-2026-0010',
          target_type: 'job',
          target_id: 'job_1',
          target_title: 'Senior Go Engineer',
          reason: 'scam_or_fraud',
          reason_category: 'scam_fraud',
          status: 'pending',
          reporter: {
            id: 'usr_secret',
            email: 'secret-reporter@example.com',
            full_name: 'Secret Candidate',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'rep_reviewing_2',
          ticket_id: 'RPT-2026-0011',
          reference: 'RPT-2026-0011',
          target_type: 'company',
          target_id: 'ent_2',
          target_title: 'Nimbus Pay',
          reason: 'misleading_information',
          reason_category: 'misleading_info',
          status: 'reviewing',
          assigned_admin: {
            id: 'adm_1',
            email: 'admin@ittalent.com',
            full_name: 'Minh Admin',
          },
          createdAt: '2026-10-20T09:00:00.000Z',
          updatedAt: '2026-10-20T09:30:00.000Z',
        },
        {
          id: 'rep_resolved_3',
          ticket_id: 'RPT-2026-0012',
          reference: 'RPT-2026-0012',
          target_type: 'job',
          target_id: 'job_3',
          target_title: 'Legacy PHP Role',
          reason: 'discrimination',
          reason_category: 'other',
          status: 'resolved',
          createdAt: '2026-10-15T08:00:00.000Z',
          updatedAt: '2026-10-16T08:00:00.000Z',
        },
        {
          id: 'rep_rejected_4',
          ticket_id: 'RPT-2026-0013',
          reference: 'RPT-2026-0013',
          target_type: 'company',
          target_id: 'ent_4',
          target_title: 'Vortex Labs',
          reason: 'something_else',
          reason_category: 'other',
          status: 'rejected',
          createdAt: '2026-10-14T08:00:00.000Z',
          updatedAt: '2026-10-15T08:00:00.000Z',
        },
      ];

      vi.mocked(sdk.getApiV1Reports).mockImplementation(async (options) => {
        const query = (options?.query ?? {}) as Record<string, unknown>;
        const status = String(query.status ?? 'pending');
        const targetType = String(query.target_type ?? 'all');
        const category = String(query.category ?? 'all');

        // Enforce exact BE adminReportsQuerySchema contract: reject "open", "closed", or 5 candidate reasons!
        if (
          !VALID_ADMIN_STATUSES.has(status) ||
          !VALID_ADMIN_TARGET_TYPES.has(targetType) ||
          !VALID_ADMIN_CATEGORIES.has(category)
        ) {
          return {
            data: undefined,
            error: {
              success: false,
              message: `Invalid query parameter: status=${status}, target_type=${targetType}, category=${category}`,
            },
            request: new Request('http://localhost/api/v1/reports'),
            response: new Response(null, { status: 400 }),
          } as never;
        }

        const filtered = sampleRecords.filter((rec) => {
          if (status === 'open') {
            if (rec.status !== 'pending' && rec.status !== 'reviewing') return false;
          } else if (status === 'closed') {
            if (rec.status !== 'resolved' && rec.status !== 'rejected' && rec.status !== 'withdrawn') return false;
          } else if (status !== 'all' && rec.status !== status) {
            return false;
          }
          if (targetType !== 'all' && rec.target_type !== targetType) return false;
          if (category !== 'all') {
            const matchesCat =
              rec.reason === category ||
              rec.reason_category === category ||
              (category === 'scam_or_fraud' && rec.reason_category === 'scam_fraud') ||
              (category === 'misleading_information' && rec.reason_category === 'misleading_info') ||
              (category === 'inappropriate_content' && rec.reason_category === 'offensive_content') ||
              (category === 'something_else' && rec.reason_category === 'other');
            if (!matchesCat) return false;
          }
          return true;
        });

        return {
          data: {
            items: filtered,
            total: filtered.length,
            page: Number(query.page ?? 1),
            limit: Number(query.limit ?? 10),
            totalPages: 1,
          },
          error: undefined,
          request: new Request('http://localhost/api/v1/reports'),
          response: new Response(null, { status: 200 }),
        } as never;
      });
    }

    it('loads default Admin Queue (Status: Open) by merging pending + reviewing without triggering 400 and hides reporter PII (Section 1 & 4.7)', async () => {
      installStrictBackendAdminMock();

      render(<AdminReportsPage />, { wrapper: createWrapper(['/admin/reports']) });

      await waitFor(() => {
        expect(screen.getByText('Senior Go Engineer')).toBeInTheDocument();
        expect(screen.getByText('Nimbus Pay')).toBeInTheDocument();
      });

      // Closed items are not shown under Status: Open
      expect(screen.queryByText('Legacy PHP Role')).toBeNull();
      expect(screen.getByText('2 open reports · newest first')).toBeInTheDocument();

      // Reporter identity is never rendered even if BE returns reporter object
      expect(screen.queryByText(/^REPORTER$/i)).toBeNull();
      expect(screen.queryByText(/secret-reporter@example\.com/i)).toBeNull();
      expect(screen.queryByText(/Secret Candidate/i)).toBeNull();
      expect(screen.getByText(/Reporter names aren’t shown/i)).toBeInTheDocument();

      // Verify BE natively received status="open" directly in 1 single request
      expect(sdk.getApiV1Reports).toHaveBeenCalledTimes(1);
      const firstCall = vi.mocked(sdk.getApiV1Reports).mock.calls[0]?.[0];
      expect(firstCall?.query?.status).toBe('open');
      expect(firstCall?.query?.category).toBe('all');
    });

    it('loads Closed filter and 5 candidate reason filters against strict BE contract without 400 (Section 1)', async () => {
      installStrictBackendAdminMock();

      const { unmount } = render(<AdminReportsPage />, {
        wrapper: createWrapper(['/admin/reports?status=closed']),
      });

      await waitFor(() => {
        expect(screen.getByText('Legacy PHP Role')).toBeInTheDocument();
        expect(screen.getByText('Vortex Labs')).toBeInTheDocument();
      });
      expect(screen.getByText('2 closed reports · newest first')).toBeInTheDocument();

      unmount();

      render(<AdminReportsPage />, {
        wrapper: createWrapper(['/admin/reports?status=open&reason=scam_or_fraud&submitted=today']),
      });

      await waitFor(() => {
        expect(screen.getByText('Senior Go Engineer')).toBeInTheDocument();
      });
      expect(screen.queryByText('Nimbus Pay')).toBeNull();
      expect(screen.getByText('1 open report · newest first')).toBeInTheDocument();
    });

    it('leaves admin decision note/message empty by default, validates min-lengths, hides unavailable Release button, cleans .png.png, and supports Resolve & Reject (Section 3.3, 4.2, 5)', async () => {
      vi.mocked(sdk.getApiV1ReportsById).mockResolvedValue({
        data: {
          data: {
            id: 'rep_1',
            reference: 'RPT-2026-0001',
            target_type: 'job',
            target_id: 'job_1',
            target_title: 'Senior Go Engineer',
            reason: 'misleading_information',
            statement: 'Job description salary is misleading.',
            evidence_files: [
              'https://res.cloudinary.com/demo/image/upload/v1/italent/reports/evidence/evidence-uuid.png.png',
            ],
            status: 'reviewing',
            reviewer: 'admin@ittalent.com',
            createdAt: '2026-10-27T10:00:00.000Z',
            updatedAt: '2026-10-27T11:00:00.000Z',
          },
        },
        error: undefined,
        request: new Request('http://localhost/api/v1/reports/RPT-2026-0001'),
        response: new Response(null, { status: 200 }),
      } as never);

      vi.mocked(sdk.patchApiV1ReportsByIdResolve).mockResolvedValueOnce({
        data: {
          data: {
            id: 'rep_1',
            status: 'rejected',
          },
        },
        error: undefined,
        request: new Request('http://localhost/api/v1/reports/rep_1/resolve'),
        response: new Response(null, { status: 200 }),
      } as never);

      render(
        <Routes>
          <Route path="/admin/reports/:ref" element={<AdminReportDetailPage />} />
        </Routes>,
        { wrapper: createWrapper(['/admin/reports/RPT-2026-0001']) },
      );

      await waitFor(() => {
        expect(screen.getByText(/Actions on the job · not available/i)).toBeInTheDocument();
      });

      // Evidence filename cleaned from .png.png -> .png
      expect(screen.getByText('evidence-uuid.png')).toBeInTheDocument();
      expect(screen.queryByText('evidence-uuid.png.png')).toBeNull();

      // Unavailable Release button is hidden until backend unclaim endpoint exists
      expect(screen.queryByRole('button', { name: /^Release$/i })).toBeNull();

      // Both note fields are EMPTY by default (Section 3.3)
      const msgInput = screen.getByLabelText(/Message to the reporter/i) as HTMLTextAreaElement;
      const notesInput = screen.getByLabelText(/Internal note/i) as HTMLTextAreaElement;
      expect(msgInput.value).toBe('');
      expect(notesInput.value).toBe('');

      // Clicking Finalize while empty triggers client min-length validation
      const finalizeBtn = screen.getByRole('button', { name: /Finalize decision/i });
      fireEvent.click(finalizeBtn);
      expect(sdk.patchApiV1ReportsByIdResolve).not.toHaveBeenCalled();
      expect(
        screen.getByText(/Message to reporter must be at least 10 characters/i),
      ).toBeInTheDocument();

      // Valid message, short internal note (< 5 chars) triggers internal notes validation
      fireEvent.change(msgInput, {
        target: { value: 'We reviewed your report carefully and closed it.' },
      });
      fireEvent.change(notesInput, { target: { value: 'ok' } });
      fireEvent.click(finalizeBtn);
      expect(
        screen.getByText(/Internal notes must be at least 5 characters/i),
      ).toBeInTheDocument();

      // Switch decision to Reject and fill valid internal note
      fireEvent.click(screen.getByRole('radio', { name: /Reject/i }));
      fireEvent.change(notesInput, {
        target: { value: 'Salary range matches verified contract documentation.' },
      });
      fireEvent.click(finalizeBtn);

      await waitFor(() => {
        expect(screen.getByText(/Finalize as Rejected\?/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /^Finalize$/i }));

      await waitFor(() => {
        expect(sdk.patchApiV1ReportsByIdResolve).toHaveBeenCalledTimes(1);
      });

      const callArgs = vi.mocked(sdk.patchApiV1ReportsByIdResolve).mock.calls[0]?.[0];
      expect(callArgs?.body).toEqual({
        decision: 'rejected',
        action_taken: undefined,
        internal_notes: 'Salary range matches verified contract documentation.',
        message_to_reporter: 'We reviewed your report carefully and closed it.',
      });
    });

    it('admin resolve sets action_taken: "none" and prevents atomic target takedown (Doc ADM-04)', async () => {
      vi.mocked(sdk.getApiV1ReportsById).mockResolvedValueOnce({
        data: {
          data: {
            id: 'rep_1',
            reference: 'RPT-2026-0001',
            target_type: 'job',
            target_id: 'job_1',
            target_title: 'Senior Go Engineer',
            reason: 'misleading_information',
            statement: 'Job description salary is misleading.',
            evidence_files: [
              'https://res.cloudinary.com/demo/image/upload/v1/italent/reports/evidence/evidence-uuid.png',
            ],
            files: [
              {
                id: 'file_orig',
                fileName: 'salary-screenshot.png',
                mimeType: 'image/png',
                size: 4096,
                downloadUrl:
                  'https://res.cloudinary.com/demo/image/upload/v1/italent/reports/evidence/evidence-uuid.png',
              },
            ],
            status: 'reviewing',
            reviewer: 'admin@ittalent.com',
            createdAt: '2026-10-27T10:00:00.000Z',
            updatedAt: '2026-10-27T11:00:00.000Z',
          },
        },
        error: undefined,
        request: new Request('http://localhost/api/v1/reports/RPT-2026-0001'),
        response: new Response(null, { status: 200 }),
      } as never);

      vi.mocked(sdk.patchApiV1ReportsByIdResolve).mockResolvedValueOnce({
        data: {
          data: {
            id: 'rep_1',
            status: 'resolved',
            action_taken: 'none',
          },
        },
        error: undefined,
        request: new Request('http://localhost/api/v1/reports/rep_1/resolve'),
        response: new Response(null, { status: 200 }),
      } as never);

      render(
        <Routes>
          <Route path="/admin/reports/:ref" element={<AdminReportDetailPage />} />
        </Routes>,
        { wrapper: createWrapper(['/admin/reports/RPT-2026-0001']) },
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Message to the reporter/i)).toBeInTheDocument();
      });

      // Displays original uploaded fileName when BE returns files metadata (Section 3.1)
      expect(screen.getByText('salary-screenshot.png')).toBeInTheDocument();
      expect(screen.queryByText('evidence-uuid.png')).toBeNull();

      fireEvent.change(screen.getByLabelText(/Message to the reporter/i), {
        target: { value: 'We reviewed the job and closed your report. Thank you.' },
      });
      fireEvent.change(screen.getByLabelText(/Internal note/i), {
        target: { value: 'Verified report details; no automated target enforcement.' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Finalize decision/i }));

      await waitFor(() => {
        expect(screen.getByText(/Finalize as Resolved\?/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /^Finalize$/i }));

      await waitFor(() => {
        expect(sdk.patchApiV1ReportsByIdResolve).toHaveBeenCalledTimes(1);
      });

      const callArgs = vi.mocked(sdk.patchApiV1ReportsByIdResolve).mock.calls[0]?.[0];
      expect(callArgs?.body?.decision).toBe('resolved');
      expect(callArgs?.body?.action_taken).toBe('none');
    });
  });
});
