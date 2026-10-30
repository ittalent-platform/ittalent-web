import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  Info,
  Lock,
  Undo2,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ADMIN_REPORTS_PATH, jobPath, adminEnterprisePath, adminUserPath } from '@/config/routes';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  REPORT_LIMITS,
  REPORT_STATUS_BADGE_CLASS,
  REPORT_TIMELINE_DOT_CLASS,
  cleanEvidenceFileName,
} from '@/features/reports/reports.constants';
import {
  useAdminReportDetailQuery,
  useClaimReportTicketMutation,
  useResolveReportTicketMutation,
} from '@/features/reports/reports.queries';
import { FinalizeDecisionDialog } from '@/features/reports/components/finalize-decision-dialog';

function TargetIcon({ type }: { type?: string }) {
  if (type === 'company' || type === 'enterprise') {
    return <Building2 className="size-5 text-muted-foreground" aria-hidden="true" />;
  }
  if (type === 'user') {
    return <User className="size-5 text-muted-foreground" aria-hidden="true" />;
  }
  return <Briefcase className="size-5 text-muted-foreground" aria-hidden="true" />;
}

export function AdminReportDetailPage() {
  const { t, i18n } = useTranslation();
  const { ref = '' } = useParams<{ ref: string }>();

  const [decision, setDecision] = useState<'resolved' | 'rejected'>('resolved');
  const [messageToReporter, setMessageToReporter] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  const { data: report, isLoading, isError, refetch } = useAdminReportDetailQuery(ref);
  const claimMutation = useClaimReportTicketMutation();
  const resolveMutation = useResolveReportTicketMutation();

  const formatDate = (isoString?: string | null) => {
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
      <div className="flex flex-col gap-6 w-full max-w-6xl pb-16">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px] gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="w-full max-w-3xl py-12">
        <ErrorState
          title={t('common.errorLoadingData', { defaultValue: 'Unable to load report detail' })}
          description={t('common.retryPrompt', { defaultValue: 'Please check your connection and try again.' })}
          onRetry={() => void refetch()}
        />
        <div className="pt-4 text-center">
          <Button asChild variant="outline">
            <Link to={ADMIN_REPORTS_PATH}>{t('reports.adminReports')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const reference = report.reference || report.ticket_id || report.id;
  const status = report.status;
  const isPending = status === 'pending';
  const isReviewing = status === 'reviewing';
  const isDecided = status === 'resolved' || status === 'rejected';
  const isWithdrawn = status === 'withdrawn';

  const reasonLabel = t(`reports.reasons.${report.reason}`, { defaultValue: report.reason });
  const statusLabel = t(`reports.statuses.${status}`, { defaultValue: status });
  const badgeClass = REPORT_STATUS_BADGE_CLASS[status] || 'bg-muted text-foreground';
  const targetTypeLabel = t(`reports.targetTypes.${report.target_type}`, { defaultValue: report.target_type });

  const targetLink =
    report.target_type === 'job' && report.target_id
      ? jobPath(report.target_id)
      : report.target_type === 'company' && report.target_id
        ? adminEnterprisePath(report.target_id)
        : report.target_type === 'user' && report.target_id
          ? adminUserPath(report.target_id)
          : null;

  const handleClaim = async () => {
    try {
      await claimMutation.mutateAsync(report.id);
      await refetch();
    } catch {
      // Handled by toast / error
    }
  };

  const handleOpenFinalizeConfirm = () => {
    setValidationError(null);
    const msgTrimmed = messageToReporter.trim();
    const notesTrimmed = internalNotes.trim();

    if (msgTrimmed.length < REPORT_LIMITS.MESSAGE_TO_REPORTER_MIN) {
      setValidationError(t('reports.errors.messageToReporterMin'));
      return;
    }
    if (msgTrimmed.length > REPORT_LIMITS.MESSAGE_TO_REPORTER_MAX) {
      setValidationError(t('reports.errors.messageToReporterMax'));
      return;
    }
    if (notesTrimmed.length < REPORT_LIMITS.INTERNAL_NOTES_MIN) {
      setValidationError(t('reports.errors.internalNotesMin'));
      return;
    }
    if (notesTrimmed.length > REPORT_LIMITS.INTERNAL_NOTES_MAX) {
      setValidationError(t('reports.errors.internalNotesMax'));
      return;
    }

    setIsFinalizeModalOpen(true);
  };

  const handleConfirmFinalize = async () => {
    try {
      await resolveMutation.mutateAsync({
        id: report.id,
        decision,
        internal_notes: internalNotes.trim(),
        message_to_reporter: messageToReporter.trim(),
      });
      setIsFinalizeModalOpen(false);
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to finalize ticket';
      setValidationError(message);
    }
  };

  const adminTimelineEntries =
    report.timeline && report.timeline.length > 0
      ? report.timeline.map((entry) => {
          if (entry.status === 'pending' || entry.status === 'submitted') {
            return {
              dotKey: 'submitted',
              label: t('reports.timeline.submitted'),
              timestamp: entry.timestamp,
            };
          }
          if (entry.status === 'reviewing' || entry.status === 'review_started') {
            return {
              dotKey: 'reviewing',
              label: report.reviewer
                ? t('reports.timeline.claimedBy', { name: report.reviewer })
                : t('reports.timeline.reviewStarted'),
              timestamp: entry.timestamp,
            };
          }
          if (entry.status === 'withdrawn') {
            return {
              dotKey: 'withdrawn',
              label: t('reports.timeline.withdrawn'),
              timestamp: entry.timestamp,
            };
          }
          const entryStatusLabel = t(`reports.statuses.${entry.status}`, {
            defaultValue: entry.status,
          });
          return {
            dotKey: entry.status,
            label: t('reports.timeline.finalizedAs', { status: entryStatusLabel }),
            timestamp: entry.timestamp,
          };
        })
      : [
          {
            dotKey: 'submitted',
            label: t('reports.timeline.submitted'),
            timestamp: report.submittedAt || report.createdAt,
          },
          ...(report.reviewer
            ? [
                {
                  dotKey: 'reviewing',
                  label: t('reports.timeline.claimedBy', { name: report.reviewer }),
                  timestamp: report.reviewed_at || report.updatedAt,
                },
              ]
            : []),
          ...(isDecided
            ? [
                {
                  dotKey: status,
                  label: t('reports.timeline.finalizedAs', { status: statusLabel }),
                  timestamp: report.resolved_at || report.updatedAt,
                },
              ]
            : isWithdrawn
              ? [
                  {
                    dotKey: 'withdrawn',
                    label: t('reports.timeline.withdrawn'),
                    timestamp: report.withdrawn_at || report.updatedAt,
                  },
                ]
              : []),
        ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl pb-20">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Link to={ADMIN_REPORTS_PATH} className="hover:text-foreground transition-colors">
          {t('reports.adminReports')}
        </Link>
        <span>/</span>
        <span className="font-mono font-semibold text-foreground">{reference}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold text-foreground truncate">
              {t('reports.detail.targetReportHeader', {
                type: targetTypeLabel,
                target: report.target_title || t('common.untitled', { defaultValue: 'Untitled' }),
              })}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
              {statusLabel}
            </span>
          </div>
          <span className="text-[13.5px] text-muted-foreground">
            {report.reviewer
              ? t('reports.detail.referenceAssigned', { reference, reviewer: report.reviewer })
              : t('reports.detail.referenceUnassigned', { reference })}
          </span>
        </div>

        {/* Claim Button (if unclaimed / pending) */}
        {isPending && (
          <Button
            type="button"
            onClick={handleClaim}
            disabled={claimMutation.isPending}
            className="self-start sm:self-auto shrink-0"
          >
            <UserCheck className="size-4 mr-2" />
            <span>{claimMutation.isPending ? t('reports.sending') : t('reports.actions.claimToReview')}</span>
          </Button>
        )}
      </div>

      {/* Read-only Notice (when not reviewing) */}
      {isPending && (
        <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
          <Info className="size-4 text-muted-foreground shrink-0" />
          <span>{t('reports.detail.readOnlyNotice')}</span>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        {/* Left Column: Report, Evidence, Reported Target, Reporter Privacy */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Report Summary Card */}
          <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line flex flex-col gap-4">
            <h2 className="font-heading text-[16px] font-bold text-foreground">
              {t('reports.detail.reportCardTitle')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('reports.detail.whatsWrongLabel')}
                </span>
                <span className="text-[14.5px] font-semibold text-foreground">
                  {reasonLabel}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('reports.columns.submitted')}
                </span>
                <span className="text-[14.5px] font-semibold text-foreground">
                  {formatDate(report.submittedAt || report.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 pt-2 border-t border-line-muted">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t('reports.detail.whatHappenedLabel')}
              </span>
              <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">
                {report.statement || report.description}
              </p>
            </div>
          </section>

          {/* Evidence Card */}
          <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line flex flex-col gap-3">
            <h2 className="font-heading text-[16px] font-bold text-foreground">
              {t('reports.detail.evidenceCardTitle')}
            </h2>
            {report.evidence_files && report.evidence_files.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2 pt-1">
                  {report.evidence_files.map((fileUrl, idx) => {
                    const fileName = cleanEvidenceFileName(fileUrl, idx);
                    return (
                      <a
                        key={`${fileUrl}-${idx}`}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-subtle text-xs font-semibold text-foreground transition-colors"
                      >
                        <FileText className="size-3.5 text-muted-foreground" />
                        <span className="max-w-[200px] truncate">{fileName}</span>
                        <ExternalLink className="size-3 text-muted-foreground ml-0.5" />
                      </a>
                    );
                  })}
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
          </section>

          {/* Reported Item Snapshot Card */}
          <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line flex flex-col gap-4">
            <h2 className="font-heading text-[16px] font-bold text-foreground">
              {t('reports.detail.reportedItem', { type: targetTypeLabel })}
            </h2>

            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-subtle border border-line-muted">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-lg bg-surface border border-line flex items-center justify-center shrink-0">
                  <TargetIcon type={report.target_type} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-[14.5px] text-foreground truncate">
                    {report.target_title || t('common.untitled', { defaultValue: 'Untitled' })}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    ID: <span className="font-mono">{report.target_id}</span>
                  </span>
                </div>
              </div>

              {targetLink && (
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link to={targetLink} target="_blank" rel="noopener noreferrer">
                    <span>{t('reports.detail.view')}</span>
                    <ExternalLink className="size-3 ml-1.5 text-muted-foreground" />
                  </Link>
                </Button>
              )}
            </div>
          </section>

          {/* Reporter Privacy Card */}
          <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line flex flex-col gap-2">
            <h2 className="font-heading text-[16px] font-bold text-foreground">
              {t('reports.detail.reporterCardTitle')}
            </h2>
            <p className="m-0 flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
              <Lock className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span>{t('reports.detail.reporterHiddenNotice')}</span>
            </p>
          </section>
        </div>

        {/* Right Rail: Decision + History */}
        <aside className="flex flex-col gap-5">
          {/* Decision Form Card (when reviewing) */}
          {isReviewing ? (
            <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line flex flex-col gap-4">
              <h2 className="font-heading text-[16px] font-bold text-foreground">
                {t('reports.detail.decisionCardTitle')}
              </h2>

              {/* Radio options: Resolve / Reject */}
              <div className="flex flex-col gap-2">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    decision === 'resolved'
                      ? 'border-primary bg-primary/5'
                      : 'border-line hover:bg-surface-subtle'
                  }`}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="resolved"
                    checked={decision === 'resolved'}
                    onChange={() => setDecision('resolved')}
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-foreground">
                      {t('reports.detail.resolveTitle')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('reports.detail.resolveSubtitle')}
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    decision === 'rejected'
                      ? 'border-primary bg-primary/5'
                      : 'border-line hover:bg-surface-subtle'
                  }`}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="rejected"
                    checked={decision === 'rejected'}
                    onChange={() => setDecision('rejected')}
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-foreground">
                      {t('reports.detail.rejectTitle')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('reports.detail.rejectSubtitle')}
                    </span>
                  </div>
                </label>
              </div>

              {/* Notice Box: Enforcement Not Available */}
              <div className="p-3.5 rounded-xl bg-surface-readonly border border-line-muted flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                  <Lock className="size-3.5 text-muted-foreground shrink-0" />
                  <span>{t('reports.detail.enforcementUnavailableTitle')}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('reports.detail.enforcementUnavailableDesc')}
                </p>
              </div>

              {/* Message to the Reporter */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="message-to-reporter" className="text-[13px] font-semibold text-foreground">
                  {t('reports.detail.messageToReporter')}
                </Label>
                <Textarea
                  id="message-to-reporter"
                  value={messageToReporter}
                  onChange={(e) => {
                    setMessageToReporter(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder={t('reports.detail.messageToReporterPlaceholder')}
                  rows={3}
                  minLength={10}
                  maxLength={500}
                  className="text-[13.5px]"
                />
                <span className="text-[11.5px] text-muted-foreground">
                  {t('reports.detail.messageToReporterHint')} ({messageToReporter.length}/500)
                </span>
              </div>

              {/* Internal Note */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="internal-notes" className="text-[13px] font-semibold text-foreground">
                  {t('reports.detail.internalNote')}
                </Label>
                <Textarea
                  id="internal-notes"
                  value={internalNotes}
                  onChange={(e) => {
                    setInternalNotes(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder={t('reports.detail.internalNotePlaceholder')}
                  rows={3}
                  minLength={5}
                  maxLength={1000}
                  className="text-[13.5px]"
                />
                <span className="text-[11.5px] text-muted-foreground">
                  {t('reports.detail.internalNoteHint')} ({internalNotes.length}/1000)
                </span>
              </div>

              {/* Validation Error Banner */}
              {validationError && (
                <div role="alert" className="text-xs font-semibold text-destructive">
                  {validationError}
                </div>
              )}

              {/* Bottom Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  title={t('reports.detail.releaseUnavailableHint')}
                >
                  {t('reports.detail.release')}
                </Button>
                <Button
                  type="button"
                  onClick={handleOpenFinalizeConfirm}
                >
                  {t('reports.detail.finalizeDecision')}
                </Button>
              </div>
            </section>
          ) : isDecided ? (
            /* Finalized Decision Card */
            <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-subtle">
                {t('reports.detail.decisionCardTitle')}
              </span>
              <div className="flex items-center gap-2 font-semibold text-[15px] text-foreground">
                {status === 'resolved' ? (
                  <CheckCircle2 className="size-5 text-(--status-success-fg)" />
                ) : (
                  <XCircle className="size-5 text-destructive" />
                )}
                <span>{t('reports.detail.verdict', { status: statusLabel })}</span>
              </div>
              {report.message_to_reporter && (
                <div className="flex flex-col gap-1 text-xs pt-2 border-t border-line-muted">
                  <span className="font-semibold text-muted-foreground">{t('reports.detail.messageToReporterLabel')}</span>
                  <p className="text-foreground whitespace-pre-wrap">{report.message_to_reporter}</p>
                </div>
              )}
              {report.internal_notes && (
                <div className="flex flex-col gap-1 text-xs pt-2 border-t border-line-muted">
                  <span className="font-semibold text-muted-foreground">{t('reports.detail.internalNoteLabel')}</span>
                  <p className="text-foreground whitespace-pre-wrap">{report.internal_notes}</p>
                </div>
              )}
            </section>
          ) : isWithdrawn ? (
            /* Withdrawn Status Card */
            <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line flex flex-col gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-subtle">
                {t('reports.detail.statusRailTitle')}
              </span>
              <div className="flex items-center gap-2 font-semibold text-[15px] text-foreground">
                <Undo2 className="size-4 text-muted-foreground shrink-0" />
                <span>{statusLabel}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t('reports.detail.withdrawnRecordDesc')}
              </p>
            </section>
          ) : (
            /* Unclaimed Status Notice Card */
            <section className="p-5 rounded-2xl bg-surface border border-line flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-subtle">
                {t('reports.detail.statusRailTitle')}
              </span>
              <span className="font-heading font-semibold text-[15px] text-foreground">
                {t('reports.detail.waitingForReviewer')}
              </span>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t('reports.detail.waitingForReviewerDesc')}
              </p>
            </section>
          )}

          {/* History Card */}
          <section aria-label={t('reports.detail.historyRailTitle')} className="p-5 rounded-2xl bg-surface border border-line flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-subtle">
              {t('reports.detail.historyRailTitle')}
            </span>
            <div className="flex flex-col gap-4 pt-1">
              {adminTimelineEntries.map((entry, idx) => (
                <div key={`${entry.dotKey}-${entry.timestamp}-${idx}`} className="flex items-start gap-3">
                  <span
                    className={`mt-1 size-2 rounded-full shrink-0 ${
                      REPORT_TIMELINE_DOT_CLASS[entry.dotKey] || 'bg-muted'
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

      {/* Finalize Decision Confirmation Dialog */}
      <FinalizeDecisionDialog
        open={isFinalizeModalOpen}
        onOpenChange={setIsFinalizeModalOpen}
        decision={decision}
        onConfirm={handleConfirmFinalize}
        isPending={resolveMutation.isPending}
        error={validationError}
      />
    </div>
  );
}
