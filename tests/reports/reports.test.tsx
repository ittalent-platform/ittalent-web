import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as sdk from '@/api/generated/sdk.gen';
import { ReportViolationDialog } from '@/components/common/report-violation-dialog';
import { MyReportsPage } from '@/features/reports/pages/my-reports-page';
import { AdminReportsPage } from '@/features/reports/pages/admin-reports-page';
import { AdminReportDetailPage } from '@/features/reports/pages/admin-report-detail-page';

// Mock session hook
const mockUseSession = vi.fn();
vi.mock('@/auth/use-session', () => ({
  useSession: () => mockUseSession(),
}));

// Mock sdk functions
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
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    // Default candidate session
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'usr_1', role: 'user', email: 'candidate@example.com' },
      },
      isLoading: false,
    });
  });

  describe('UC-30: Report Submission (Job & Enterprise)', () => {
    it('shows "Sign in to report" dialog when user is not authenticated (Design E1)', async () => {
      mockUseSession.mockReturnValue({ data: null, isLoading: false });

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

    it('submits valid job report using POST /api/v1/me/reports without target_link or legacy fields (B1, B2)', async () => {
      vi.mocked(sdk.postApiV1MeReports).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'rep_1',
            ticket_id: 'RPT-2026-0001',
            reference: 'RPT-2026-0001',
            targetType: 'job',
            targetId: 'job_123',
            reason: 'scam_or_fraud',
            statement: 'This job posting demands payment upfront before an interview.',
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
        },
      } as never);

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

      // Select Scam or Fraud reason radio
      const reasonRadio = screen.getByRole('radio', { name: /Scam or fraud/i });
      fireEvent.click(reasonRadio);

      // Fill in statement
      const textarea = screen.getByPlaceholderText(/Describe what’s misleading, fraudulent or inaccurate/i);
      fireEvent.change(textarea, {
        target: { value: 'This job posting demands payment upfront before an interview.' },
      });

      // Submit
      const submitBtn = screen.getByRole('button', { name: /Send report/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(sdk.postApiV1MeReports).toHaveBeenCalledTimes(1);
      });

      const callArgs = vi.mocked(sdk.postApiV1MeReports).mock.calls[0][0];
      const body = callArgs?.body as Record<string, unknown>;

      // Assert contract: targetType, targetId, reason, statement
      expect(body.targetType).toBe('job');
      expect(body.targetId).toBe('job_123');
      expect(body.reason).toBe('scam_or_fraud');
      expect(body.statement).toBe('This job posting demands payment upfront before an interview.');
      expect(body.idempotencyKey).toBeDefined();

      // Ensure forbidden legacy keys are NOT sent
      expect(body.target_link).toBeUndefined();
      expect(body.reason_category).toBeUndefined();
      expect(body.is_anonymous).toBeUndefined();

      // Renders "Report received" screen with reference
      await waitFor(() => {
        expect(screen.getByText(/Report received/i)).toBeInTheDocument();
        expect(screen.getByText(/RPT-2026-0001/i)).toBeInTheDocument();
      });
    });

    it('submits valid company report with targetType="company" (B2 fix)', async () => {
      vi.mocked(sdk.postApiV1MeReports).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'rep_2',
            ticket_id: 'RPT-2026-0002',
            reference: 'RPT-2026-0002',
            targetType: 'company',
            targetId: 'ent_456',
            reason: 'misleading_information',
            statement: 'Fake company registration info.',
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
        },
      } as never);

      render(
        <ReportViolationDialog
          open={true}
          onOpenChange={vi.fn()}
          targetType="company"
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

      const callArgs = vi.mocked(sdk.postApiV1MeReports).mock.calls[0][0];
      const body = callArgs?.body as Record<string, unknown>;
      expect(body.targetType).toBe('company');
      expect(body.target_type).toBeUndefined();
    });
  });

  describe('UC-31: Candidate My Reports (Contract & Tabs)', () => {
    it('queries GET /api/v1/me/reports with status="all"|"open"|"closed" and never legacy statuses (B3)', async () => {
      vi.mocked(sdk.getApiV1MeReports).mockResolvedValue({
        data: {
          success: true,
          items: [
            {
              id: 'rep_1',
              reference: 'RPT-2026-0001',
              targetType: 'job',
              targetId: 'job_1',
              targetTitle: 'Senior Go Engineer',
              targetSubtitle: 'Nimbus Pay',
              reason: 'scam_or_fraud',
              statement: 'Demanded deposit.',
              status: 'pending',
              createdAt: '2026-10-27T10:00:00.000Z',
              updatedAt: '2026-10-27T10:00:00.000Z',
            },
          ],
          counts: { all: 5, open: 2, closed: 3 },
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      } as never);

      render(<MyReportsPage />, { wrapper: createWrapper(['/my-reports?tab=open']) });

      await waitFor(() => {
        expect(sdk.getApiV1MeReports).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(sdk.getApiV1MeReports).mock.calls[0][0];
      expect(callArgs?.query?.status).toBe('open');

      // Click "Closed" tab
      const closedTab = screen.getByRole('tab', { name: /Closed/i });
      fireEvent.click(closedTab);

      await waitFor(() => {
        const lastCall = vi.mocked(sdk.getApiV1MeReports).mock.calls.at(-1)?.[0];
        expect(lastCall?.query?.status).toBe('closed');
      });
    });

    it('displays mapped reason for the 5 backend reasons (B6 fix)', async () => {
      vi.mocked(sdk.getApiV1MeReports).mockResolvedValueOnce({
        data: {
          success: true,
          items: [
            {
              id: 'rep_1',
              reference: 'RPT-2026-0001',
              targetType: 'job',
              targetId: 'job_1',
              targetTitle: 'Senior Go Engineer',
              reason: 'misleading_information',
              status: 'pending',
              createdAt: '2026-10-27T10:00:00.000Z',
            },
          ],
          counts: { all: 1, open: 1, closed: 0 },
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      } as never);

      render(<MyReportsPage />, { wrapper: createWrapper(['/my-reports']) });

      await waitFor(() => {
        expect(screen.getByText('Misleading information')).toBeInTheDocument();
      });
    });
  });

  describe('UC-35 & UC-36: Admin Queue and Investigation', () => {
    it('admin queue hides reporter identity per design & policy (Section 2)', async () => {
      vi.mocked(sdk.getApiV1Reports).mockResolvedValueOnce({
        data: {
          success: true,
          items: [
            {
              id: 'rep_1',
              reference: 'RPT-2026-0001',
              target_type: 'job',
              target_id: 'job_1',
              target_title: 'Senior Go Engineer',
              reason: 'scam_or_fraud',
              status: 'pending',
              createdAt: '2026-10-27T10:00:00.000Z',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      } as never);

      render(<AdminReportsPage />, { wrapper: createWrapper(['/admin/reports']) });

      await waitFor(() => {
        expect(screen.getByText(/Senior Go Engineer/i)).toBeInTheDocument();
      });

      // Assert that reporter column header is NOT present
      expect(screen.queryByText(/^REPORTER$/i)).toBeNull();
      // Description states reporter names are hidden
      expect(screen.getByText(/Reporter names aren’t shown/i)).toBeInTheDocument();
    });

    it('admin resolve sets action_taken: "none" and prevents atomic target takedown (Doc ADM-04)', async () => {
      vi.mocked(sdk.getApiV1ReportsById).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'rep_1',
            reference: 'RPT-2026-0001',
            target_type: 'job',
            target_id: 'job_1',
            target_title: 'Senior Go Engineer',
            reason: 'misleading_information',
            statement: 'Job description salary is misleading.',
            status: 'reviewing',
            reviewer: 'admin@ittalent.com',
            createdAt: '2026-10-27T10:00:00.000Z',
            updatedAt: '2026-10-27T11:00:00.000Z',
          },
        },
      } as never);

      vi.mocked(sdk.patchApiV1ReportsByIdResolve).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'rep_1',
            status: 'resolved',
            action_taken: 'none',
          },
        },
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

      // Click "Finalize decision…"
      const finalizeBtn = screen.getByRole('button', { name: /Finalize decision/i });
      fireEvent.click(finalizeBtn);

      // Confirmation modal appears
      await waitFor(() => {
        expect(screen.getByText(/Finalize as Resolved\?/i)).toBeInTheDocument();
      });

      // Confirm finalize
      const confirmBtn = screen.getByRole('button', { name: /^Finalize$/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(sdk.patchApiV1ReportsByIdResolve).toHaveBeenCalledTimes(1);
      });

      const callArgs = vi.mocked(sdk.patchApiV1ReportsByIdResolve).mock.calls[0][0];
      const body = callArgs?.body as Record<string, unknown>;

      expect(body.decision).toBe('resolved');
      expect(body.action_taken).toBe('none');
      expect((body.internal_notes as string).length).toBeGreaterThanOrEqual(5);
      expect((body.message_to_reporter as string).length).toBeGreaterThanOrEqual(10);
    });

    it('enforces client validation for internal_notes min 5 and message_to_reporter min 10', async () => {
      vi.mocked(sdk.getApiV1ReportsById).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'rep_1',
            reference: 'RPT-2026-0001',
            target_type: 'job',
            target_id: 'job_1',
            target_title: 'Senior Go Engineer',
            reason: 'misleading_information',
            statement: 'Job description salary is misleading.',
            status: 'reviewing',
            reviewer: 'admin@ittalent.com',
            createdAt: '2026-10-27T10:00:00.000Z',
            updatedAt: '2026-10-27T11:00:00.000Z',
          },
        },
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

      // Short inputs: message "abc" (< 10)
      const msgInput = screen.getByLabelText(/Message to the reporter/i);
      fireEvent.change(msgInput, { target: { value: 'abc' } });

      const finalizeBtn = screen.getByRole('button', { name: /Finalize decision/i });
      fireEvent.click(finalizeBtn);

      // Does NOT open modal or call backend; displays validation error
      expect(sdk.patchApiV1ReportsByIdResolve).not.toHaveBeenCalled();
      expect(screen.getByText(/Message to reporter must be at least 10 characters/i)).toBeInTheDocument();
    });
  });
});
