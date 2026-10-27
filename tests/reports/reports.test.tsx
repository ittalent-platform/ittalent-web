import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DeleteReportDialog,
  MyReportDetailDialog,
  ReportViolationDialog,
  WithdrawReportDialog,
} from '@/features/reports';
import type { ReportDto } from '@/features/reports/reports.types';

vi.mock('@/api/client', () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { client } from '@/api/client';

describe('Reports Feature Unit & Component Tests', () => {
  let queryClient: QueryClient;

  function createWrapper() {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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
  });

  const mockReport: ReportDto = {
    id: 'rep_123',
    ticket_id: 'REP-2026-0001',
    target_type: 'job',
    target_id: 'job_456',
    target_title: 'Software Engineer Position',
    target_link: 'https://example.com/job/456',
    reason_category: 'scam_fraud',
    title: 'Tin tuyển dụng lừa đảo nộp tiền cọc',
    description: 'Yêu cầu ứng viên chuyển khoản 500k tiền đồng phục trước khi phỏng vấn.',
    evidence_files: ['https://example.com/proof1.png'],
    is_anonymous: true,
    status: 'pending',
    timeline: [
      {
        status: 'pending',
        timestamp: '2026-10-27T10:00:00.000Z',
        note: 'Báo cáo được gửi thành công.',
      },
    ],
    createdAt: '2026-10-27T10:00:00.000Z',
    updatedAt: '2026-10-27T10:00:00.000Z',
  };

  describe('ReportViolationDialog Component', () => {
    it('validates input length and displays validation error for short input', async () => {
      render(
        <ReportViolationDialog
          open={true}
          onOpenChange={vi.fn()}
          targetType="job"
          targetId="job_456"
          targetTitle="Software Engineer Position"
        />,
        { wrapper: createWrapper() },
      );

      const titleInput = screen.getByLabelText(/Tóm tắt vi phạm/i);
      const descInput = screen.getByLabelText(/Mô tả chi tiết sự việc/i);
      const submitBtn = screen.getByRole('button', { name: /Gửi báo cáo/i });

      // Enter short inputs
      fireEvent.change(titleInput, { target: { value: 'abc' } });
      fireEvent.change(descInput, { target: { value: 'Too short' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Tiêu đề báo cáo phải từ 5 đến 100 ký tự/i)).toBeInTheDocument();
      });
    });

    it('submits report successfully when inputs are valid', async () => {
      vi.mocked(client.post).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            ...mockReport,
            ticket_id: 'REP-2026-0002',
          },
        },
      } as never);

      render(
        <ReportViolationDialog
          open={true}
          onOpenChange={vi.fn()}
          targetType="job"
          targetId="job_456"
          targetTitle="Software Engineer Position"
        />,
        { wrapper: createWrapper() },
      );

      const titleInput = screen.getByLabelText(/Tóm tắt vi phạm/i);
      const descInput = screen.getByLabelText(/Mô tả chi tiết sự việc/i);
      const submitBtn = screen.getByRole('button', { name: /Gửi báo cáo/i });

      fireEvent.change(titleInput, { target: { value: 'Vi phạm yêu cầu đóng phí tuyển dụng' } });
      fireEvent.change(descInput, {
        target: {
          value: 'Nhà tuyển dụng này nhắn tin qua Zalo yêu cầu đóng phí hồ sơ 200k trước khi phỏng vấn.',
        },
      });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(client.post).toHaveBeenCalledWith({
          url: '/api/v1/reports',
          body: expect.objectContaining({
            target_type: 'job',
            target_id: 'job_456',
            title: 'Vi phạm yêu cầu đóng phí tuyển dụng',
          }),
        });
      });
    });
  });

  describe('MyReportDetailDialog Component', () => {
    it('renders report details and status stepper correctly', () => {
      render(
        <MyReportDetailDialog
          report={mockReport}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText('#REP-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('Tin tuyển dụng lừa đảo nộp tiền cọc')).toBeInTheDocument();
      expect(
        screen.getByText('Yêu cầu ứng viên chuyển khoản 500k tiền đồng phục trước khi phỏng vấn.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Chờ duyệt')).toBeInTheDocument();
      expect(screen.getByText('Đã tiếp nhận')).toBeInTheDocument();
    });
  });

  describe('WithdrawReportDialog Component', () => {
    it('submits withdrawal reason and triggers mutation', async () => {
      vi.mocked(client.patch).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            ...mockReport,
            status: 'withdrawn',
          },
        },
      } as never);

      const onOpenChange = vi.fn();

      render(
        <WithdrawReportDialog
          report={mockReport}
          open={true}
          onOpenChange={onOpenChange}
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText(/Xác nhận rút vé #REP-2026-0001\?/i)).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /Xác nhận rút báo cáo/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(client.patch).toHaveBeenCalledWith({
          url: '/api/v1/me/reports/rep_123/withdraw',
          body: expect.objectContaining({
            withdrawal_reason: expect.any(String),
          }),
        });
      });
    });
  });

  describe('DeleteReportDialog Component', () => {
    it('calls delete endpoint on confirmation', async () => {
      vi.mocked(client.delete).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Báo cáo đã được xóa khỏi lịch sử của bạn.',
        },
      } as never);

      render(
        <DeleteReportDialog
          report={{ ...mockReport, status: 'withdrawn' }}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText(/Xóa vé #REP-2026-0001\?/i)).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', { name: /Xóa khỏi danh sách/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(client.delete).toHaveBeenCalledWith({
          url: '/api/v1/me/reports/rep_123',
        });
      });
    });
  });

  describe('AdminInvestigationWorkspace Component', () => {
    const mockAdminReport = {
      ...mockReport,
      reporter: {
        id: 'usr_reporter',
        email: 'applicant@example.com',
        full_name: 'Nguyen Van A',
      },
      assigned_admin: null,
      internal_notes: null,
    };

    it('claims pending ticket successfully', async () => {
      vi.mocked(client.patch).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            ...mockAdminReport,
            status: 'reviewing',
          },
        },
      } as never);

      const { AdminInvestigationWorkspace } = await import('@/features/reports');

      render(
        <AdminInvestigationWorkspace
          report={mockAdminReport}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText(/Nhận xử lý hồ sơ/i)).toBeInTheDocument();

      const claimBtn = screen.getByRole('button', { name: /Nhận xử lý hồ sơ/i });
      fireEvent.click(claimBtn);

      await waitFor(() => {
        expect(client.patch).toHaveBeenCalledWith({
          url: '/api/v1/admin/reports/rep_123/claim',
        });
      });
    });

    it('finalizes resolution with internal notes and message to reporter', async () => {
      vi.mocked(client.patch).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Báo cáo đã được giải quyết thành công.',
          data: {
            ...mockAdminReport,
            status: 'resolved',
            action_taken: 'content_takedown',
          },
        },
      } as never);

      const { AdminInvestigationWorkspace } = await import('@/features/reports');

      render(
        <AdminInvestigationWorkspace
          report={{ ...mockAdminReport, status: 'reviewing' }}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper: createWrapper() },
      );

      const notesInput = screen.getByPlaceholderText(/Ghi chú bằng chứng xác minh/i);
      const messageInput = screen.getByPlaceholderText(/Thông báo kết quả xử lý và lời cảm ơn/i);
      const submitBtn = screen.getByRole('button', { name: /Hoàn tất & Thi hành quyết định/i });

      fireEvent.change(notesInput, {
        target: { value: 'Xác minh có hành vi thu phí đặt cọc, vi phạm điều 4 quy chế.' },
      });
      fireEvent.change(messageInput, {
        target: { value: 'Cảm ơn bạn đã phản ánh, ban quản trị đã gỡ bỏ tin tuyển dụng vi phạm.' },
      });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(client.patch).toHaveBeenCalledWith({
          url: '/api/v1/admin/reports/rep_123/resolve',
          body: expect.objectContaining({
            decision: 'resolved',
            action_taken: 'content_takedown',
            internal_notes: 'Xác minh có hành vi thu phí đặt cọc, vi phạm điều 4 quy chế.',
            message_to_reporter:
              'Cảm ơn bạn đã phản ánh, ban quản trị đã gỡ bỏ tin tuyển dụng vi phạm.',
          }),
        });
      });
    });
  });
});
