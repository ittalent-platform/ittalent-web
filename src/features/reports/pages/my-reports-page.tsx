import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Briefcase, Building2, MoreHorizontal, User, Eye, Undo2, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useListParams } from '@/hooks/use-list-params';
import { myReportDetailPath } from '@/config/routes';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { SearchInput } from '@/components/common/search-input';
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
  CLOSED_REPORT_STATUSES,
  type ReportCandidateTab,
} from '@/features/reports/reports.constants';
import { useMyReportsQuery } from '@/features/reports/reports.queries';
import type { ReportItemResponse } from '@/features/reports/reports.types';
import { WithdrawReportDialog } from '@/features/reports/components/withdraw-report-dialog';
import { HideReportDialog } from '@/features/reports/components/hide-report-dialog';

function TargetIcon({ type }: { type?: string }) {
  if (type === 'company' || type === 'enterprise') {
    return <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />;
  }
  if (type === 'user') {
    return <User className="size-4 text-muted-foreground" aria-hidden="true" />;
  }
  return <Briefcase className="size-4 text-muted-foreground" aria-hidden="true" />;
}

export function MyReportsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { page, limit, search, debouncedSearch, set } = useListParams({ defaultLimit: 10 });
  const rawTab = searchParams.get('tab');
  const activeTab: ReportCandidateTab = rawTab === 'open' || rawTab === 'closed' ? rawTab : 'all';

  const [withdrawTarget, setWithdrawTarget] = useState<ReportItemResponse | null>(null);
  const [hideTarget, setHideTarget] = useState<ReportItemResponse | null>(null);

  const { data, isLoading, isError, refetch } = useMyReportsQuery({
    page,
    limit,
    status: activeTab,
    search: debouncedSearch,
  });

  const reports = data?.items ?? [];
  const countsAll = data?.counts?.all ?? 0;
  const countsOpen = data?.counts?.open ?? 0;
  const countsClosed = data?.counts?.closed ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const tabsConfig = useMemo(
    () => [
      { key: 'all' as const, label: t('reports.tabs.all'), count: countsAll },
      { key: 'open' as const, label: t('reports.tabs.open'), count: countsOpen },
      { key: 'closed' as const, label: t('reports.tabs.closed'), count: countsClosed },
    ],
    [countsAll, countsOpen, countsClosed, t],
  );

  return (
    <div className="flex flex-col gap-5 w-full max-w-6xl pb-12">
      {/* Page Title */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t('reports.myReports')}
        </h1>
      </div>

      {/* Toolbar: Search (Left) + 3 Tabs (Right) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(val) => set('search', val)}
            placeholder={t('reports.searchPlaceholder')}
            className="h-10 text-[13.5px]"
          />
        </div>

        <div role="tablist" aria-label="Status" className="flex items-center gap-2 self-start sm:self-auto">
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => set('tab', tab.key === 'all' ? null : tab.key)}
                className={`h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary'
                    : 'bg-background text-muted-foreground border border-line hover:bg-surface-subtle hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-xs ${isActive ? 'text-primary' : 'text-slate-subtle'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Table Surface */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        {isError ? (
          <div className="p-8">
            <ErrorState
              title={t('common.errorLoadingData', { defaultValue: 'Unable to load reports' })}
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
                <TableHeaderCell className="w-[130px] font-bold text-[11.5px] uppercase tracking-[0.06em] text-slate-subtle py-3">
                  {t('reports.columns.submitted')}
                </TableHeaderCell>
                <TableHeaderCell className="w-[120px] font-bold text-[11.5px] uppercase tracking-[0.06em] text-slate-subtle py-3">
                  {t('reports.columns.status')}
                </TableHeaderCell>
                <TableHeaderCell className="w-[48px] pr-4 py-3" />
              </TableHeaderRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableSkeletonRows columns={5} rows={5} />
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4">
                    <EmptyState
                      title={
                        debouncedSearch
                          ? t('reports.empty.adminTitle')
                          : activeTab === 'open'
                            ? t('reports.empty.openTitle')
                            : activeTab === 'closed'
                              ? t('reports.empty.closedTitle')
                              : t('reports.empty.allTitle')
                      }
                      description={
                        debouncedSearch
                          ? t('reports.empty.adminDescription')
                          : activeTab === 'open'
                            ? t('reports.empty.openDescription')
                            : activeTab === 'closed'
                              ? t('reports.empty.closedDescription')
                              : t('reports.empty.allDescription')
                      }
                    />
                  </td>
                </tr>
              ) : (
                reports.map((item) => {
                  const targetRef = item.reference || item.id;
                  const canWithdraw = item.status === 'pending';
                  const canHide = CLOSED_REPORT_STATUSES.includes(item.status);
                  const reasonLabel = t(`reports.reasons.${item.reason}`, { defaultValue: item.reason });
                  const statusLabel = t(`reports.statuses.${item.status}`, { defaultValue: item.status });
                  const badgeClass = REPORT_STATUS_BADGE_CLASS[item.status] || 'bg-muted text-foreground';

                  const targetType = item.target?.type ?? item.target_type ?? 'job';
                  const targetTitle = item.target?.title ?? item.target_title ?? t('common.untitled', { defaultValue: 'Untitled' });
                  const targetSubtitle = item.target?.subtitle;

                  return (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-surface-subtle transition-colors group"
                      onClick={() => navigate(myReportDetailPath(targetRef))}
                    >
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg bg-surface-subtle border border-line flex items-center justify-center shrink-0">
                            <TargetIcon type={targetType} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-[14px] text-foreground truncate group-hover:text-primary transition-colors">
                              {targetTitle}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {t(`reports.targetTypes.${targetType}`, { defaultValue: targetType })}
                              {targetSubtitle ? ` · ${targetSubtitle}` : ''}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 text-[13.5px] text-foreground">
                        {reasonLabel}
                      </TableCell>

                      <TableCell className="py-3.5 text-[13px] text-muted-foreground whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </TableCell>

                      <TableCell className="py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                          {statusLabel}
                        </span>
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
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate(myReportDetailPath(targetRef))}>
                              <Eye className="size-4 mr-2" />
                              <span>{t('reports.actions.view')}</span>
                            </DropdownMenuItem>

                            {canWithdraw && (
                              <DropdownMenuItem
                                variant="warning"
                                onClick={() => setWithdrawTarget(item)}
                              >
                                <Undo2 className="size-4 mr-2" />
                                <span>{t('reports.actions.withdraw')}</span>
                              </DropdownMenuItem>
                            )}

                            {canHide && (
                              <DropdownMenuItem
                                onClick={() => setHideTarget(item)}
                                className="text-muted-foreground focus:text-foreground"
                              >
                                <EyeOff className="size-4 mr-2" />
                                <span>{t('reports.actions.hide')}</span>
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
                end: Math.min(page * limit, data?.total ?? 0),
                total: data?.total ?? 0,
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

      {/* Withdraw Modal */}
      <WithdrawReportDialog
        open={Boolean(withdrawTarget)}
        onOpenChange={(isOpen) => !isOpen && setWithdrawTarget(null)}
        report={withdrawTarget}
        onSuccess={() => setWithdrawTarget(null)}
      />

      {/* Hide Modal */}
      <HideReportDialog
        open={Boolean(hideTarget)}
        onOpenChange={(isOpen) => !isOpen && setHideTarget(null)}
        report={hideTarget}
        onSuccess={() => setHideTarget(null)}
      />
    </div>
  );
}
