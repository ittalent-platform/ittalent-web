import { useState } from 'react';
import {
  Eye,
  Shield,
  Trash2,
  Undo2,
} from 'lucide-react';

import { PageHeader } from '@/components/common/admin-page-header';
import { TableSurface } from '@/components/common/data-table';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { KpiStrip } from '@/components/common/kpi-strip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from '@/components/ui/table';
import { DeleteReportDialog } from '@/features/reports/components/delete-report-dialog';
import { MyReportDetailDialog } from '@/features/reports/components/my-report-detail-dialog';
import { WithdrawReportDialog } from '@/features/reports/components/withdraw-report-dialog';
import {
  REPORT_REASON_CATEGORIES,
  REPORT_STATUS_CONFIG,
  REPORT_TARGET_TYPE_LABELS,
} from '@/features/reports/reports.constants';
import { useMyReportsQuery } from '@/features/reports/reports.queries';
import type { ReportDto } from '@/features/reports/reports.types';

export function MyReportsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedReportForDetail, setSelectedReportForDetail] = useState<ReportDto | null>(null);
  const [selectedReportForWithdraw, setSelectedReportForWithdraw] = useState<ReportDto | null>(null);
  const [selectedReportForDelete, setSelectedReportForDelete] = useState<ReportDto | null>(null);

  const { data, isLoading, isError, refetch } = useMyReportsQuery({
    page,
    limit,
    status: statusFilter,
  });

  const reports = data?.items ?? [];
  const kpis = data?.kpis ?? {
    total: 0,
    pending: 0,
    reviewing: 0,
    resolved: 0,
    rejected: 0,
    withdrawn: 0,
  };

  const statusFilterTabs = [
    { key: 'all', label: 'Tất cả báo cáo' },
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'reviewing', label: 'Đang điều tra' },
    { key: 'resolved', label: 'Đã giải quyết' },
    { key: 'withdrawn', label: 'Đã rút lại' },
    { key: 'rejected', label: 'Đã từ chối' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl">
      {/* Standard Page Header */}
      <PageHeader
        title="Báo cáo của tôi"
        description="Theo dõi tiến độ xác minh và kết quả xử lý các báo cáo vi phạm bạn đã gửi trên hệ thống."
      />

      {/* Official Design System KPI Strip */}
      <KpiStrip
        label="Thống kê báo cáo của bạn"
        items={[
          {
            key: 'total',
            label: 'Tổng báo cáo',
            value: String(kpis.total),
            note: 'Tất cả vi phạm đã gửi',
          },
          {
            key: 'pending',
            label: 'Chờ kiểm duyệt',
            value: String(kpis.pending),
            note: 'Đang xếp hàng xác minh',
          },
          {
            key: 'reviewing',
            label: 'Đang điều tra',
            value: String(kpis.reviewing),
            note: 'Chuyên viên đang xử lý',
          },
          {
            key: 'resolved',
            label: 'Đã giải quyết',
            value: String(kpis.resolved),
            note: 'Đã áp dụng biện pháp xử lý',
          },
        ]}
      />

      {/* Filter Tabs Toolbar */}
      <div className="p-1.5 rounded-xl border border-border bg-card shadow-2xs flex items-center gap-1 overflow-x-auto scrollbar-none">
        {statusFilterTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={statusFilter === tab.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            className="rounded-lg text-xs font-semibold shrink-0 h-8 px-4 transition-colors"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Reports Table or States */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Đang tải lịch sử báo cáo...</span>
        </div>
      ) : isError ? (
        <ErrorState
          description="Không thể tải danh sách báo cáo. Vui lòng thử lại sau."
          onRetry={() => refetch()}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Bạn chưa có báo cáo vi phạm nào"
          description="Khi phát hiện các tin tuyển dụng lừa đảo, thu phí hoặc doanh nghiệp giả mạo, hãy bấm nút Báo cáo để gửi yêu cầu kiểm tra."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <TableSurface>
            <Table>
              <TableHead>
                <TableHeaderRow className="hover:bg-transparent">
                  <TableHeaderCell className="w-[130px] font-semibold text-xs">MÃ VÉ</TableHeaderCell>
                  <TableHeaderCell className="min-w-[200px] font-semibold text-xs">ĐỐI TƯỢNG BỊ BÁO CÁO</TableHeaderCell>
                  <TableHeaderCell className="font-semibold text-xs">DANH MỤC</TableHeaderCell>
                  <TableHeaderCell className="font-semibold text-xs">NGÀY GỬI</TableHeaderCell>
                  <TableHeaderCell className="font-semibold text-xs">TRẠNG THÁI</TableHeaderCell>
                  <TableHeaderCell className="text-right font-semibold text-xs w-[140px]">THAO TÁC</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => {
                  const statusCfg = REPORT_STATUS_CONFIG[report.status] || {
                    label: report.status,
                    className: '',
                  };
                  const reasonCfg = REPORT_REASON_CATEGORIES.find((c) => c.value === report.reason_category);

                  const canWithdraw = report.status === 'pending';
                  const canDelete =
                    report.status === 'resolved' ||
                    report.status === 'rejected' ||
                    report.status === 'withdrawn';

                  return (
                    <TableRow key={report.id} className="hover:bg-muted/30 transition-colors">
                      {/* Ticket ID */}
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        #{report.ticket_id}
                      </TableCell>

                      {/* Target Entity */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-[260px]">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            {REPORT_TARGET_TYPE_LABELS[report.target_type]}
                          </span>
                          <span className="font-semibold text-foreground text-[13.5px] truncate">
                            {report.target_title}
                          </span>
                        </div>
                      </TableCell>

                      {/* Reason Category */}
                      <TableCell>
                        <span className="text-xs text-foreground font-medium">
                          {reasonCfg?.defaultLabel ?? report.reason_category}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        <Badge variant="neutral" className={`font-semibold text-xs ${statusCfg.className}`}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReportForDetail(report)}
                            className="h-8 px-2.5 text-xs font-semibold gap-1 text-foreground hover:bg-muted"
                            title="Xem chi tiết & tiến độ"
                          >
                            <Eye className="size-3.5" />
                            <span>Chi tiết</span>
                          </Button>

                          {canWithdraw && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReportForWithdraw(report)}
                              className="h-8 px-2 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                              title="Rút lại báo cáo"
                            >
                              <Undo2 className="size-3.5" />
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReportForDelete(report)}
                              className="h-8 px-2 text-xs font-medium text-destructive hover:bg-destructive/10"
                              title="Xóa khỏi lịch sử"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableSurface>

          {data && data.total > limit && (
            <div className="flex justify-end pt-2">
              <Pagination
                page={page}
                totalPages={data.totalPages}
                total={data.total}
                limit={limit}
                onPageChange={(p) => setPage(p)}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Modals & Dialogs */}
      <MyReportDetailDialog
        report={selectedReportForDetail}
        open={Boolean(selectedReportForDetail)}
        onOpenChange={(open) => !open && setSelectedReportForDetail(null)}
        onWithdrawClick={(rep) => {
          setSelectedReportForDetail(null);
          setSelectedReportForWithdraw(rep);
        }}
        onDeleteClick={(rep) => {
          setSelectedReportForDetail(null);
          setSelectedReportForDelete(rep);
        }}
      />

      <WithdrawReportDialog
        report={selectedReportForWithdraw}
        open={Boolean(selectedReportForWithdraw)}
        onOpenChange={(open) => !open && setSelectedReportForWithdraw(null)}
      />

      <DeleteReportDialog
        report={selectedReportForDelete}
        open={Boolean(selectedReportForDelete)}
        onOpenChange={(open) => !open && setSelectedReportForDelete(null)}
      />
    </div>
  );
}
