import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Briefcase, Building2, MoreHorizontal, User, Eye, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useListParams } from '@/hooks/use-list-params';
import { adminReportDetailPath } from '@/config/routes';
import { AdminPageHeader } from '@/components/common/admin-page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ListToolbar } from '@/components/common/list-toolbar';
import { FilterSelect } from '@/components/ui/filter-select';
import { prefixedFilterTrigger } from '@/components/common/prefixed-filter-trigger';
import { NumberedPagination } from '@/components/common/numbered-pagination';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TableSkeletonRows,
} from '@/components/ui/table';
import {
  REPORT_STATUS_BADGE_CLASS,
  REPORT_REASONS,
} from '@/features/reports/reports.constants';
import {
  useAdminReportsQuery,
  useClaimReportTicketMutation,
} from '@/features/reports/reports.queries';
import type { AdminReportItem } from '@/features/reports/reports.types';

function TargetIcon({ type }: { type?: string }) {
  if (type === 'company' || type === 'enterprise') {
    return <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />;
  }
  if (type === 'user') {
    return <User className="size-4 text-muted-foreground" aria-hidden="true" />;
  }
  return <Briefcase className="size-4 text-muted-foreground" aria-hidden="true" />;
}

export function AdminReportsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { page, limit, search, debouncedSearch, set } = useListParams({ defaultLimit: 10 });

  const statusParam = searchParams.get('status') || 'open';
  const reasonParam = searchParams.get('reason') || 'all';
  const typeParam = searchParams.get('type') || 'all';
  const submittedParam = searchParams.get('submitted') || 'all';

  const { data, isLoading, isError, refetch } = useAdminReportsQuery({
    page,
    limit,
    status: statusParam,
    category: reasonParam,
    target_type: typeParam,
    submitted: submittedParam,
    search: debouncedSearch,
  });

  const claimMutation = useClaimReportTicketMutation();

  const reports = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const statusOptions = useMemo(
    () => [
      { label: t('reports.tabs.open'), value: 'open' },
      { label: t('reports.filters.all'), value: 'all' },
      { label: t('reports.statuses.pending'), value: 'pending' },
      { label: t('reports.statuses.reviewing'), value: 'reviewing' },
      { label: t('reports.statuses.resolved'), value: 'resolved' },
      { label: t('reports.statuses.rejected'), value: 'rejected' },
      { label: t('reports.statuses.withdrawn'), value: 'withdrawn' },
      { label: t('reports.tabs.closed'), value: 'closed' },
    ],
    [t],
  );

  const reasonOptions = useMemo(
    () => [
      { label: t('reports.filters.all'), value: 'all' },
      ...REPORT_REASONS.map((r) => ({
        label: t(`reports.reasons.${r}`),
        value: r,
      })),
    ],
    [t],
  );

  const typeOptions = useMemo(
    () => [
      { label: t('reports.filters.all'), value: 'all' },
      { label: t('reports.targetTypes.job'), value: 'job' },
      { label: t('reports.targetTypes.company'), value: 'company' },
      { label: t('reports.targetTypes.user'), value: 'user' },
    ],
    [t],
  );

  const submittedOptions = useMemo(
    () => [
      { label: t('reports.filters.anyTime'), value: 'all' },
      { label: t('reports.filters.today'), value: 'today' },
      { label: t('reports.filters.past7Days'), value: '7d' },
      { label: t('reports.filters.past30Days'), value: '30d' },
    ],
    [t],
  );

  const handleClaim = async (item: AdminReportItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await claimMutation.mutateAsync(item.id);
      navigate(adminReportDetailPath(item.reference || item.ticket_id || item.id));
    } catch {
      // Invalidation handles toast / error
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full pb-16">
      {/* Admin Page Header */}
      <AdminPageHeader
        title={t('reports.adminReports')}
        description={t('reports.adminDescription')}
      />

      {/* Filters Toolbar */}
      <ListToolbar
        search={search}
        onSearchChange={(val) => set('search', val)}
        searchPlaceholder={t('reports.searchAdminPlaceholder')}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <FilterSelect
            value={statusParam}
            onChange={(val) => set('status', val === 'open' ? null : val)}
            options={statusOptions}
            renderTrigger={prefixedFilterTrigger(t('reports.filters.statusPrefix'))}
          />

          <FilterSelect
            value={reasonParam}
            onChange={(val) => set('reason', val === 'all' ? null : val)}
            options={reasonOptions}
            renderTrigger={prefixedFilterTrigger(t('reports.filters.reasonPrefix'))}
          />

          <FilterSelect
            value={typeParam}
            onChange={(val) => set('type', val === 'all' ? null : val)}
            options={typeOptions}
            renderTrigger={prefixedFilterTrigger(t('reports.filters.typePrefix'))}
          />

          <FilterSelect
            value={submittedParam}
            onChange={(val) => set('submitted', val === 'all' ? null : val)}
            options={submittedOptions}
            renderTrigger={prefixedFilterTrigger(t('reports.filters.submittedPrefix'))}
          />
        </div>
      </ListToolbar>

      {/* Subheader summary */}
      <div className="text-xs text-muted-foreground font-medium">
        {statusParam === 'open'
          ? t('reports.summaryOpen', { count: total })
          : statusParam === 'closed'
            ? t('reports.summaryClosed', { count: total })
            : t('reports.summaryAll', { count: total })}
      </div>

      {/* Table Surface */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        {isError ? (
          <div className="p-8">
            <ErrorState
              title={t('common.errorLoadingData', { defaultValue: 'Unable to load report queue' })}
              description={t('common.retryPrompt', { defaultValue: 'Please check your connection and try again.' })}
              onRetry={() => void refetch()}
            />
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableHeaderRow className="bg-surface-readonly border-b border-line-muted">
                <TableHeaderCell className="font-bold text-[11.5px] uppercase tracking-[0.06em] text-slate-subtle pl-5 py-3">
                  {t('reports.columns.reported')}
                </TableHeaderCell>
                <TableHeaderCell className="w-[190px] font-bold text-[11.5px] uppercase tracking-[0.06em] text-slate-subtle py-3">
                  {t('reports.columns.reason')}
                </TableHeaderCell>
                <TableHeaderCell className="w-[160px] font-bold text-[11.5px] uppercase tracking-[0.06em] text-slate-subtle py-3">
                  {t('reports.columns.submitted')}
                </TableHeaderCell>
                <TableHeaderCell className="w-[120px] font-bold text-[11.5px] uppercase tracking-[0.06em] text-slate-subtle py-3">
                  {t('reports.columns.status')}
                </TableHeaderCell>
                <TableHeaderCell className="w-[140px] font-bold text-[11.5px] uppercase tracking-[0.06em] text-slate-subtle py-3">
                  {t('reports.columns.reviewer')}
                </TableHeaderCell>
                <TableHeaderCell className="w-[48px] pr-4 py-3" />
              </TableHeaderRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableSkeletonRows columns={6} rows={5} />
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4">
                    <EmptyState
                      title={t('reports.empty.adminTitle')}
                      description={t('reports.empty.adminDescription')}
                    />
                  </td>
                </tr>
              ) : (
                reports.map((item) => {
                  const targetRef = item.reference || item.ticket_id || item.id;
                  const reasonLabel = t(`reports.reasons.${item.reason}`, { defaultValue: item.reason });
                  const statusLabel = t(`reports.statuses.${item.status}`, { defaultValue: item.status });
                  const badgeClass = REPORT_STATUS_BADGE_CLASS[item.status] || 'bg-muted text-foreground';
                  const canClaim = item.status === 'pending';

                  return (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-surface-subtle transition-colors group"
                      onClick={() => navigate(adminReportDetailPath(targetRef))}
                    >
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg bg-surface-subtle border border-line flex items-center justify-center shrink-0">
                            <TargetIcon type={item.target_type} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-[14px] text-foreground truncate group-hover:text-primary transition-colors">
                              {item.target_title || t('common.untitled', { defaultValue: 'Untitled' })}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              <span className="font-mono">{targetRef}</span> ·{' '}
                              {t(`reports.targetTypes.${item.target_type}`, { defaultValue: item.target_type })}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 text-[13.5px] text-foreground">
                        {reasonLabel}
                      </TableCell>

                      <TableCell className="py-3.5 text-[13px] text-muted-foreground whitespace-nowrap">
                        {formatDate(item.submittedAt || item.createdAt)}
                      </TableCell>

                      <TableCell className="py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                          {statusLabel}
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 text-[13px] text-muted-foreground">
                        {item.reviewer || (
                          <span className="text-slate-subtle italic">
                            {t('reports.detail.notClaimed')}
                          </span>
                        )}
                      </TableCell>

                      <TableCell
                        className="py-3.5 pr-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              aria-label="Actions"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => navigate(adminReportDetailPath(targetRef))}>
                              <Eye className="size-4 mr-2" />
                              <span>{t('reports.actions.open')}</span>
                            </DropdownMenuItem>

                            {canClaim && (
                              <DropdownMenuItem
                                onClick={(e) => handleClaim(item, e)}
                                className="text-primary focus:text-primary"
                              >
                                <UserCheck className="size-4 mr-2" />
                                <span>{t('reports.actions.claimToReview')}</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-line bg-surface">
            <span className="text-xs text-muted-foreground">
              {t('pagination.showing', {
                start: (page - 1) * limit + 1,
                end: Math.min(page * limit, total),
                total,
                defaultValue: `Showing ${page} of ${totalPages}`,
              })}
            </span>
            <NumberedPagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => set('page', String(p))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
