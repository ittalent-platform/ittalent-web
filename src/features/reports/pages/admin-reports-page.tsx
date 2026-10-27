import { useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Search,
} from 'lucide-react';

import { AdminPageHeader } from '@/components/common/admin-page-header';
import { TableSurface } from '@/components/common/data-table';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { KpiStrip } from '@/components/common/kpi-strip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from '@/components/ui/table';
import { AdminInvestigationWorkspace } from '@/features/reports/components/admin-investigation-workspace';
import {
  REPORT_REASON_CATEGORIES,
  REPORT_STATUS_CONFIG,
  REPORT_TARGET_TYPE_LABELS,
} from '@/features/reports/reports.constants';
import { useAdminReportsQuery } from '@/features/reports/reports.queries';
import type { AdminReportDto } from '@/features/reports/reports.types';

export function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedReportForWorkspace, setSelectedReportForWorkspace] = useState<AdminReportDto | null>(null);

  const { data, isLoading, isError, refetch } = useAdminReportsQuery({
    page,
    limit,
    status: statusFilter,
    target_type: targetTypeFilter,
    category: categoryFilter,
    search: debouncedSearch || undefined,
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchTerm);
    setPage(1);
  };

  const statusFilterTabs = [
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'reviewing', label: 'Đang điều tra' },
    { key: 'resolved', label: 'Đã giải quyết' },
    { key: 'rejected', label: 'Đã bác bỏ' },
    { key: 'withdrawn', label: 'Đã rút lại' },
    { key: 'all', label: 'Tất cả vé' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl">
      {/* Standard Admin Page Header */}
      <AdminPageHeader
        title="Báo cáo vi phạm"
        description="Hàng đợi kiểm duyệt, điều tra và thi hành chế tài đối với các vi phạm an toàn nền tảng."
      />

      {/* Official Design System KPI Strip */}
      <KpiStrip
        label="Thống kê hàng đợi kiểm duyệt"
        items={[
          {
            key: 'pending',
            label: 'Chờ tiếp nhận',
            value: String(kpis.pending),
            note: 'Ưu tiên xử lý trong 24h',
          },
          {
            key: 'reviewing',
            label: 'Đang điều tra',
            value: String(kpis.reviewing),
            note: 'Admin đã nhận hồ sơ',
          },
          {
            key: 'resolved',
            label: 'Đã giải quyết',
            value: String(kpis.resolved),
            note: 'Đã thi hành chế tài',
          },
          {
            key: 'total',
            label: 'Tổng số hồ sơ',
            value: String(kpis.total),
            note: 'Bao gồm cả từ chối & rút',
          },
        ]}
      />

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-border shadow-2xs">
        {/* Status Tabs */}
        <div className="p-1 rounded-xl bg-sand-subtle/80 border border-border flex items-center gap-1 overflow-x-auto scrollbar-none w-fit">
          {statusFilterTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className="rounded-lg text-xs font-semibold shrink-0 h-8 px-3.5 transition-colors"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Search & Filter Dropdowns */}
        <div className="flex items-center gap-3 flex-wrap">
          <form onSubmit={handleSearchSubmit} className="relative min-w-[240px] flex-1">
            <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã vé, tên đối tượng, người báo cáo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-[13px]"
            />
          </form>

          {/* Target Type Filter */}
          <Select
            value={targetTypeFilter}
            onValueChange={(val) => {
              setTargetTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-[13px] w-[150px]">
              <SelectValue placeholder="Đối tượng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi đối tượng</SelectItem>
              <SelectItem value="job">Tin tuyển dụng</SelectItem>
              <SelectItem value="enterprise">Doanh nghiệp</SelectItem>
              <SelectItem value="user">Người dùng</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onValueChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-[13px] w-[170px]">
              <SelectValue placeholder="Danh mục vi phạm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi danh mục</SelectItem>
              {REPORT_REASON_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.defaultLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports Data Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Đang tải danh sách kiểm duyệt...</span>
        </div>
      ) : isError ? (
        <ErrorState
          description="Không thể tải dữ liệu vi phạm. Vui lòng thử lại sau."
          onRetry={() => refetch()}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Không có báo cáo nào phù hợp"
          description="Hàng đợi kiểm duyệt hiện tại không có báo cáo nào với bộ lọc đã chọn."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <TableSurface>
            <Table>
              <TableHead>
                <TableHeaderRow className="hover:bg-transparent">
                  <TableHeaderCell className="w-[120px] font-semibold text-xs">MÃ VÉ</TableHeaderCell>
                  <TableHeaderCell className="min-w-[200px] font-semibold text-xs">ĐỐI TƯỢNG BỊ TỐ CÁO</TableHeaderCell>
                  <TableHeaderCell className="font-semibold text-xs">NGƯỜI BÁO CÁO</TableHeaderCell>
                  <TableHeaderCell className="font-semibold text-xs">DANH MỤC</TableHeaderCell>
                  <TableHeaderCell className="font-semibold text-xs">NGÀY GỬI</TableHeaderCell>
                  <TableHeaderCell className="font-semibold text-xs">TRẠNG THÁI</TableHeaderCell>
                  <TableHeaderCell className="text-right font-semibold text-xs w-[120px]">THAO TÁC</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => {
                  const statusCfg = REPORT_STATUS_CONFIG[report.status] || {
                    label: report.status,
                    className: '',
                  };
                  const reasonCfg = REPORT_REASON_CATEGORIES.find((c) => c.value === report.reason_category);

                  return (
                    <TableRow key={report.id} className="hover:bg-muted/30 transition-colors">
                      {/* Ticket ID */}
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        #{report.ticket_id}
                      </TableCell>

                      {/* Target Entity */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-[240px]">
                          <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
                            {REPORT_TARGET_TYPE_LABELS[report.target_type]}
                          </span>
                          <span className="font-semibold text-foreground text-[13.5px] truncate">
                            {report.target_title}
                          </span>
                        </div>
                      </TableCell>

                      {/* Reporter */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-[160px] text-xs">
                          <span className="font-medium text-foreground truncate">
                            {report.reporter.full_name || report.reporter.username || 'Ẩn danh'}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {report.reporter.email}
                          </span>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <span className="text-xs text-foreground font-medium">
                          {reasonCfg?.defaultLabel ?? report.reason_category}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant="neutral" className={`font-semibold text-xs ${statusCfg.className}`}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setSelectedReportForWorkspace(report)}
                          className="h-8 px-3 text-xs font-semibold gap-1"
                        >
                          <Eye className="size-3.5" />
                          <span>{report.status === 'pending' || report.status === 'reviewing' ? 'Xử lý' : 'Chi tiết'}</span>
                        </Button>
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

      {/* Admin Investigation Workspace Dialog */}
      <AdminInvestigationWorkspace
        report={selectedReportForWorkspace}
        open={Boolean(selectedReportForWorkspace)}
        onOpenChange={(open) => !open && setSelectedReportForWorkspace(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
