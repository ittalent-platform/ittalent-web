import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Briefcase,
  Building2,
  FileText,
  ExternalLink,
  ShieldCheck,
  Undo2,
  EyeOff,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MY_REPORTS_PATH } from '@/config/routes';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  CLOSED_REPORT_STATUSES,
  REPORT_STATUS_BADGE_CLASS,
  REPORT_TIMELINE_DOT_CLASS,
  UNAVAILABLE_TARGET_BACKEND_SUBTITLE,
  cleanEvidenceFileName,
  formatReportTargetSubtitle,
} from '@/features/reports/reports.constants';
import { useMyReportDetailQuery } from '@/features/reports/reports.queries';
import { WithdrawReportDialog } from '@/features/reports/components/withdraw-report-dialog';
import { HideReportDialog } from '@/features/reports/components/hide-report-dialog';

function TargetIcon({ type }: { type?: string }) {
  if (type === 'company' || type === 'enterprise') {
    return <Building2 className="size-5 text-muted-foreground" aria-hidden="true" />;
  }
  if (type === 'user') {
    return <User className="size-5 text-muted-foreground" aria-hidden="true" />;
  }
  return <Briefcase className="size-5 text-muted-foreground" aria-hidden="true" />;
}

export function MyReportDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { ref = '' } = useParams<{ ref: string }>();

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isHideOpen, setIsHideOpen] = useState(false);

  const { data: report, isLoading, isError, refetch } = useMyReportDetailQuery(ref);

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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl pb-16">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="w-full max-w-3xl py-12">
        <ErrorState
          title={t('common.errorLoadingData', { defaultValue: 'Unable to load report detail' })}
          description={t('common.retryPrompt', { defaultValue: 'Please check your connection or verify the report reference.' })}
          onRetry={() => void refetch()}
        />
        <div className="pt-4 text-center">
          <Button asChild variant="outline">
            <Link to={MY_REPORTS_PATH}>{t('reports.viewMyReports')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const reference = report.reference || report.id;
  const status = report.status;
  const canWithdraw = report.canWithdraw ?? status === 'pending';
  const canHide = report.canHide ?? CLOSED_REPORT_STATUSES.includes(status);
  const reasonLabel = t(`reports.reasons.${report.reason}`, { defaultValue: report.reason });
  const statusLabel = t(`reports.statuses.${status}`, { defaultValue: status });
  const badgeClass = REPORT_STATUS_BADGE_CLASS[status] || 'bg-muted text-foreground';

  const targetType = report.target?.type ?? 'job';
  const targetTitle = report.target?.title || t('common.untitled', { defaultValue: 'Untitled' });
  const rawSubtitle = report.target?.subtitle;
  const isAvailable =
    report.target?.isAvailable !== false &&
    rawSubtitle !== UNAVAILABLE_TARGET_BACKEND_SUBTITLE;
  const typeLabel = t(`reports.targetTypes.${targetType}`, { defaultValue: targetType });
  const formattedSubtitle = formatReportTargetSubtitle({
    subtitle: rawSubtitle,
    typeLabel,
    isAvailable,
  });

  const responseText = report.responseFromPlatform;
  const files = report.files ?? [];

  const getHistoryLabel = (event: string, fallbackLabel: string): string => {
    switch (event) {
      case 'submitted':
      case 'pending':
        return t('reports.timeline.submitted');
      case 'review_started':
      case 'reviewing':
        return t('reports.timeline.reviewStarted');
      case 'resolved':
        return t('reports.timeline.resolved');
      case 'rejected':
        return t('reports.timeline.rejected');
      case 'withdrawn':
        return t('reports.timeline.withdrawnByYou');
      default:
        return fallbackLabel;
    }
  };

  const historyEntries =
    report.history && report.history.length > 0
      ? report.history.map((entry) => ({
          event: entry.event,
          label: getHistoryLabel(entry.event, entry.label),
          timestamp: entry.timestamp,
        }))
      : [
          {
            event: 'submitted',
            label: t('reports.timeline.submitted'),
            timestamp: report.submittedAt,
          },
          ...(status === 'reviewing' || status === 'resolved' || status === 'rejected'
            ? [
                {
                  event: 'review_started',
                  label: t('reports.timeline.reviewStarted'),
                  timestamp: report.submittedAt,
                },
              ]
            : []),
          ...(status === 'withdrawn'
            ? [
                {
                  event: 'withdrawn',
                  label: t('reports.timeline.withdrawnByYou'),
                  timestamp: report.submittedAt,
                },
              ]
            : status === 'resolved' || status === 'rejected'
              ? [
                  {
                    event: status,
                    label: statusLabel,
                    timestamp: report.submittedAt,
                  },
                ]
              : []),
        ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl pb-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Link to={MY_REPORTS_PATH} className="hover:text-foreground transition-colors">
          {t('reports.myReports')}
        </Link>
        <span>/</span>
        <span className="font-mono font-semibold text-foreground">{reference}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold text-foreground truncate">
              {t('reports.detail.reportAbout', { target: targetTitle })}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
              {statusLabel}
            </span>
          </div>
          <span className="text-[13.5px] text-muted-foreground">
            {t('reports.detail.referenceSubmitted', {
              reference,
              date: formatDate(report.submittedAt),
            })}
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {canWithdraw && (
            <Button
              type="button"
              variant="outline"
              className="text-(--status-warning-fg) border-(--status-warning-fg)/30 hover:bg-(--status-warning-bg)"
              onClick={() => setIsWithdrawOpen(true)}
            >
              <Undo2 className="size-4 mr-2" />
              <span>{t('reports.actions.withdraw')}</span>
            </Button>
          )}

          {canHide && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsHideOpen(true)}
            >
              <EyeOff className="size-4 mr-2" />
              <span>{t('reports.actions.hide')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Response from ITTalent Card (if present) */}
          {responseText ? (
            <section
              aria-label={t('reports.detail.responseFromPlatform')}
              className="p-5 sm:p-6 rounded-2xl bg-surface border border-line flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 text-primary font-semibold text-[15px]">
                <ShieldCheck className="size-5 shrink-0" />
                <span>{t('reports.detail.responseFromPlatform')}</span>
              </div>
              <div className="p-4 rounded-xl bg-surface-subtle border border-line-muted text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">
                {responseText}
              </div>
            </section>
          ) : null}

          {/* What you reported Card */}
          <section
            aria-label={t('reports.detail.whatYouReported')}
            className="p-5 sm:p-6 rounded-2xl bg-surface border border-line flex flex-col gap-4"
          >
            <h2 className="font-heading text-[16px] font-bold text-foreground">
              {t('reports.detail.whatYouReported')}
            </h2>

            {/* Target Item Row */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-subtle border border-line-muted">
              <div className="size-10 rounded-lg bg-surface border border-line flex items-center justify-center shrink-0">
                <TargetIcon type={targetType} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-[14.5px] text-foreground truncate">
                    {targetTitle}
                  </span>
                  {!isAvailable && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-(--sand) text-(--slate-muted) border border-(--line) shrink-0">
                      {t('reports.noLongerAvailable')}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {formattedSubtitle}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t('reports.detail.whatsWrongLabel')}
              </span>
              <span className="text-[14.5px] font-semibold text-foreground">
                {reasonLabel}
              </span>
            </div>

            {/* Statement */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t('reports.detail.whatHappenedLabel')}
              </span>
              <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">
                {report.statement}
              </p>
            </div>

            {/* Evidence Files */}
            <div className="flex flex-col gap-2 pt-2 border-t border-line-muted">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t('reports.detail.filesLabel')}
              </span>
              {files.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {files.map((fileObj, idx) => (
                      <a
                        key={fileObj.id || `${fileObj.downloadUrl}-${idx}`}
                        href={fileObj.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-subtle text-xs font-semibold text-foreground transition-colors"
                      >
                        <FileText className="size-3.5 text-muted-foreground" />
                        <span className="max-w-[200px] truncate">
                          {cleanEvidenceFileName(fileObj.fileName, idx)}
                        </span>
                        <ExternalLink className="size-3 text-muted-foreground ml-0.5" />
                      </a>
                    ))}
                  </div>
                  <span className="text-[12px] text-muted-foreground">
                    {t('reports.detail.evidencePrivateLinkNotice')}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t('reports.detail.noFiles')}
                </span>
              )}
            </div>
          </section>
        </div>

        {/* Right Rail (300px) */}
        <aside className="flex flex-col gap-4">
          {/* Status Card */}
          <section className="p-5 rounded-2xl bg-surface border border-line flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-subtle">
              {t('reports.detail.statusRailTitle')}
            </span>
            <span className="font-heading font-semibold text-[15px] text-foreground">
              {status === 'pending'
                ? t('reports.detail.waitingForReview')
                : status === 'reviewing'
                  ? t('reports.statuses.reviewing')
                  : status === 'withdrawn'
                    ? t('reports.detail.youWithdrewIt')
                    : t('reports.detail.reviewedAndClosed')}
            </span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {status === 'pending' || status === 'reviewing'
                ? t('reports.detail.waitingForReviewDesc')
                : status === 'withdrawn'
                  ? t('reports.detail.withdrawnDesc')
                  : t('reports.detail.reportClosedDesc')}
            </p>
          </section>

          {/* History Card */}
          <section aria-label={t('reports.detail.historyRailTitle')} className="p-5 rounded-2xl bg-surface border border-line flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-subtle">
              {t('reports.detail.historyRailTitle')}
            </span>
            <div className="flex flex-col gap-4 pt-1">
              {historyEntries.map((entry, idx) => (
                <div key={`${entry.event}-${entry.timestamp}-${idx}`} className="flex items-start gap-3">
                  <span
                    className={`mt-1 size-2 rounded-full shrink-0 ${
                      REPORT_TIMELINE_DOT_CLASS[entry.event] || 'bg-muted'
                    }`}
                  />
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold text-foreground">{entry.label}</span>
                    <span className="text-muted-foreground">{formatDate(entry.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Withdraw Modal */}
      <WithdrawReportDialog
        open={isWithdrawOpen}
        onOpenChange={setIsWithdrawOpen}
        report={report}
        onSuccess={() => void refetch()}
      />

      {/* Hide Modal */}
      <HideReportDialog
        open={isHideOpen}
        onOpenChange={setIsHideOpen}
        report={report}
        onSuccess={() => navigate(MY_REPORTS_PATH)}
      />
    </div>
  );
}
