import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Paperclip,
  Shield,
  Upload,
  X,
} from 'lucide-react';

import { client } from '@/api/client';
import { postApiV1MeReports } from '@/api/generated/sdk.gen';
import type {
  PostApiV1MeReportsErrors,
  PostApiV1MeReportsResponses,
} from '@/api/generated/types.gen';
import { unwrap } from '@/api/request-error';
import { useSession } from '@/auth/use-session';
import {
  REPORT_EVIDENCE_ACCEPT,
  REPORT_LIMITS,
  REPORT_REASONS,
  formatReportTargetSubtitle,
  isCandidateReportRole,
  normalizeEvidenceFileForUpload,
  validateReportEvidenceFile,
  type ReportReason,
  type ReportTargetType,
} from '@/config/reports';
import { MY_REPORTS_PATH } from '@/config/routes';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ReportViolationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  targetSubtitle?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractSubmittedReference(result: unknown): string | null {
  if (!isRecord(result)) return null;
  if (typeof result.reference === 'string' && result.reference) {
    return result.reference;
  }
  if (typeof result.ticket_id === 'string' && result.ticket_id) {
    return result.ticket_id;
  }
  if (isRecord(result.data)) {
    if (typeof result.data.reference === 'string' && result.data.reference) {
      return result.data.reference;
    }
    if (typeof result.data.ticket_id === 'string' && result.data.ticket_id) {
      return result.data.ticket_id;
    }
  }
  return null;
}

export function ReportViolationDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetTitle,
  targetSubtitle,
}: ReportViolationDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session } = useSession();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
  const [statement, setStatement] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [statementError, setStatementError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID());

  const statementId = useId();

  const resetFormState = () => {
    setSelectedReason('');
    setStatement('');
    setFiles([]);
    setReasonError(null);
    setStatementError(null);
    setFileError(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setSubmittedReference(null);
    setIdempotencyKey(crypto.randomUUID());
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetFormState();
    }
    onOpenChange(nextOpen);
  };

  const dialogTitle =
    targetType === 'job'
      ? t('reports.titleJob')
      : targetType === 'user'
        ? t('reports.titleUser')
        : t('reports.titleCompany');

  const typeLabel =
    targetType === 'job'
      ? t('reports.targetTypes.job')
      : targetType === 'user'
        ? t('reports.targetTypes.user')
        : t('reports.targetTypes.company');

  const formattedTargetSubtitle = formatReportTargetSubtitle({
    subtitle: targetSubtitle,
    typeLabel,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (!selected.length) return;

    const accepted: File[] = [];
    const errors: string[] = [];

    for (const file of selected) {
      const problem = validateReportEvidenceFile(file);
      if (problem === 'format') {
        errors.push(t('reports.errors.fileNotAcceptedNamed', { name: file.name }));
        continue;
      }
      if (problem === 'empty') {
        errors.push(t('reports.errors.fileEmptyNamed', { name: file.name }));
        continue;
      }
      if (problem === 'size') {
        errors.push(t('reports.errors.fileTooLargeNamed', { name: file.name }));
        continue;
      }

      if (files.length + accepted.length >= REPORT_LIMITS.MAX_FILES) {
        errors.push(t('reports.errors.tooManyFiles'));
        break;
      }

      accepted.push(normalizeEvidenceFileForUpload(file));
    }

    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted]);
    }
    setFileError(errors.length > 0 ? errors.join(' ') : null);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    let hasValidationError = false;

    if (!selectedReason) {
      setReasonError(t('reports.errors.reasonRequired'));
      hasValidationError = true;
    } else {
      setReasonError(null);
    }

    const trimmedStatement = statement.trim();
    if (!trimmedStatement) {
      setStatementError(t('reports.errors.statementRequired'));
      hasValidationError = true;
    } else if (trimmedStatement.length > REPORT_LIMITS.STATEMENT_MAX) {
      setStatementError(t('reports.errors.statementTooLong'));
      hasValidationError = true;
    } else {
      setStatementError(null);
    }

    if (hasValidationError || !selectedReason) {
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedTargetType = targetType === 'enterprise' ? 'company' : targetType;
      const effectiveKey = idempotencyKey || crypto.randomUUID();

      if (files.length > 0) {
        const formData = new FormData();
        formData.append('targetType', normalizedTargetType);
        formData.append('targetId', targetId);
        formData.append('reason', selectedReason);
        formData.append('statement', trimmedStatement);
        formData.append('idempotencyKey', effectiveKey);
        for (const file of files) {
          formData.append('files', file);
        }

        const res = await client.post<PostApiV1MeReportsResponses, PostApiV1MeReportsErrors>({
          security: [{ scheme: 'bearer', type: 'http' }],
          url: '/api/v1/me/reports',
          body: formData,
          bodySerializer: null,
        });
        const result = unwrap(res, t('reports.errors.statementRequired'));
        const returnedRef = extractSubmittedReference(result);
        if (returnedRef) setSubmittedReference(returnedRef);
      } else {
        const res = await postApiV1MeReports({
          body: {
            targetType: normalizedTargetType,
            targetId,
            reason: selectedReason,
            statement: trimmedStatement,
            idempotencyKey: effectiveKey,
          },
        });
        const result = unwrap(res, t('reports.errors.statementRequired'));
        const returnedRef = extractSubmittedReference(result);
        if (returnedRef) setSubmittedReference(returnedRef);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('reports.errors.statementRequired');
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // State E1: Guest Signed Out prompt
  if (!session) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[440px] p-6 text-center flex flex-col items-center gap-4">
          <div className="size-12 rounded-full bg-(--sand) text-(--ink) flex items-center justify-center">
            <Lock className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <DialogTitle className="itt-display text-xl font-semibold text-(--ink)">
            {t('reports.signInPromptTitle')}
          </DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('reports.signInPromptBody')}
          </p>
          <div className="flex gap-3 w-full justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('reports.cancel')}
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              onClick={() => {
                onOpenChange(false);
                navigate(`/login?next=${returnUrl}`);
              }}
            >
              {t('reports.signIn')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Non-candidate signed-in account (recruiter / enterprise_admin / system admin)
  if (!isCandidateReportRole(session.user.role)) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[440px] p-6 text-center flex flex-col items-center gap-4">
          <div className="size-12 rounded-full bg-(--sand) text-(--ink) flex items-center justify-center">
            <Lock className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <DialogTitle className="itt-display text-xl font-semibold text-(--ink)">
            {t('reports.candidateOnlyTitle')}
          </DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('reports.candidateOnlyBody')}
          </p>
          <div className="flex gap-3 w-full justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('reports.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // State E0: Successfully Received Outcome
  if (submittedReference) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[460px] p-7 text-center flex flex-col items-center gap-3">
          <div className="size-13 rounded-full bg-(--status-success-bg) text-(--status-success-fg) flex items-center justify-center">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </div>
          <DialogTitle className="itt-display text-xl font-semibold text-(--ink)">
            {t('reports.receivedTitle')}
          </DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('reports.receivedBody', { reference: submittedReference })}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {targetType === 'job'
                ? t('reports.backToJob')
                : t('reports.backToCompany')}
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              onClick={() => {
                onOpenChange(false);
                navigate(MY_REPORTS_PATH);
              }}
            >
              {t('reports.viewMyReports')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Default: Report submission form matching MyReport.html
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[600px] p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-5">
        <DialogTitle className="itt-display text-xl font-semibold text-(--ink)">
          {dialogTitle}
        </DialogTitle>

        {/* Target summary item card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-(--surface-readonly) border border-(--line)">
          <div className="size-10 rounded-lg bg-(--sand) text-(--ink) font-bold text-sm flex items-center justify-center shrink-0">
            {targetTitle.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate text-(--ink)">
              {targetTitle}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {formattedTargetSubtitle}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Reason radio choices */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-(--ink)">
              {t('reports.whatsWrong')} <span className="text-destructive">*</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
              {REPORT_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <label
                    key={reason}
                    className={`flex items-center gap-2.5 h-[42px] px-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5 font-semibold text-(--ink)'
                        : reasonError
                          ? 'border-(--status-error-fg)/40 hover:bg-(--sand-hover) text-(--slate)'
                          : 'border-(--line) hover:bg-(--sand-hover) text-(--slate)'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason}
                      checked={isSelected}
                      onChange={() => {
                        setSelectedReason(reason);
                        setReasonError(null);
                        setSubmitError(null);
                      }}
                      className="sr-only"
                    />
                    <span
                      className={`size-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'border-primary bg-background ring-4 ring-primary'
                          : 'border-(--slate-disabled) bg-background'
                      }`}
                    >
                      {isSelected && <span className="size-1.5 rounded-full bg-primary" />}
                    </span>
                    <span className="truncate">{t(`reports.reasons.${reason}`)}</span>
                  </label>
                );
              })}
            </div>
            {reasonError && (
              <div
                role="alert"
                className="flex items-start gap-2 p-2.5 rounded-lg bg-(--status-error-bg) border border-(--status-error-fg)/20 text-xs text-(--status-error-fg)"
              >
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{reasonError}</span>
              </div>
            )}
          </div>

          {/* Statement textarea */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={statementId} className="text-xs font-semibold text-(--ink)">
                {t('reports.tellUsWhatHappened')} <span className="text-destructive">*</span>
              </label>
              <span className="text-xs text-muted-foreground">
                {statement.length}/{REPORT_LIMITS.STATEMENT_MAX}
              </span>
            </div>
            <textarea
              id={statementId}
              rows={4}
              maxLength={REPORT_LIMITS.STATEMENT_MAX}
              value={statement}
              aria-invalid={Boolean(statementError)}
              onChange={(e) => {
                setStatement(e.target.value);
                setStatementError(null);
                setSubmitError(null);
              }}
              placeholder={t('reports.statementPlaceholder')}
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-(--ink) placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                statementError ? 'border-destructive' : 'border-(--input)'
              }`}
            />
            {statementError && (
              <p
                role="alert"
                className="m-0 flex items-center gap-1.5 text-xs text-(--status-error-fg)"
              >
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{statementError}</span>
              </p>
            )}
          </div>

          {/* File attachments */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length >= REPORT_LIMITS.MAX_FILES}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--fg-link) hover:underline disabled:opacity-50 self-start"
              >
                <Paperclip className="size-3.5" aria-hidden="true" />
                <span>{t('reports.addFiles')}</span>
              </button>
              <span className="text-[11.5px] text-muted-foreground">
                {t('reports.filesHelper')}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={REPORT_EVIDENCE_ACCEPT}
              className="hidden"
              onChange={handleFileChange}
            />
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {files.map((file, idx) => (
                  <span
                    key={`${file.name}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-(--sand) border border-(--line) text-xs text-(--ink)"
                  >
                    <Upload className="size-3 text-muted-foreground" aria-hidden="true" />
                    <span className="max-w-[160px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {fileError && (
              <div
                role="alert"
                className="flex items-start gap-2 p-2.5 rounded-lg bg-(--status-error-bg) border border-(--status-error-fg)/20 text-xs text-(--status-error-fg)"
              >
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* Privacy line */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Shield className="size-3.5 text-primary shrink-0" aria-hidden="true" />
            <span>{t('reports.privacyLine')}</span>
          </div>

          {/* Submit error notice */}
          {submitError && (
            <div
              role="alert"
              className="p-2.5 rounded-lg bg-(--status-error-bg) border border-(--status-error-fg)/20 text-xs text-(--status-error-fg)"
            >
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-(--line)">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('reports.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary-hover font-semibold px-5"
            >
              {isSubmitting ? t('reports.sending') : t('reports.sendReport')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
