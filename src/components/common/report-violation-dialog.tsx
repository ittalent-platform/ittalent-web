import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import {
  CheckCircle2,
  Lock,
  Paperclip,
  Shield,
  Upload,
  X,
} from 'lucide-react';

import { postApiV1MeReports } from '@/api/generated/sdk.gen';
import type { CreateReportRequest } from '@/api/generated/types.gen';
import { unwrap } from '@/api/request-error';
import { useSession } from '@/auth/use-session';
import { MY_REPORTS_PATH } from '@/config/routes';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  REPORT_LIMITS,
  REPORT_REASONS,
  type ReportReason,
  type ReportTargetType,
} from '@/features/reports/reports.constants';

export interface ReportViolationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  targetSubtitle?: string;
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const statementId = useId();

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedReason('');
      setStatement('');
      setFiles([]);
      setValidationError(null);
      setIsSubmitting(false);
      setSubmittedReference(null);
      setIdempotencyKey(crypto.randomUUID());
    }
    onOpenChange(nextOpen);
  };

  const dialogTitle =
    targetType === 'job'
      ? t('reports.titleJob')
      : targetType === 'user'
        ? t('reports.titleUser')
        : t('reports.titleCompany');

  const defaultSubtitle =
    targetType === 'job'
      ? t('reports.targetTypes.job')
      : targetType === 'user'
        ? t('reports.targetTypes.user')
        : t('reports.targetTypes.company');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    if (files.length + selected.length > REPORT_LIMITS.MAX_FILES) {
      setValidationError(t('reports.errors.tooManyFiles'));
      return;
    }

    for (const file of selected) {
      if (file.size > REPORT_LIMITS.MAX_FILE_SIZE_BYTES) {
        setValidationError(t('reports.errors.fileTooLarge'));
        return;
      }
    }

    setValidationError(null);
    setFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedReason) {
      setValidationError(t('reports.errors.reasonRequired'));
      return;
    }

    const trimmedStatement = statement.trim();
    if (!trimmedStatement) {
      setValidationError(t('reports.errors.statementRequired'));
      return;
    }

    if (trimmedStatement.length > REPORT_LIMITS.STATEMENT_MAX) {
      setValidationError(t('reports.errors.statementTooLong'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend accepts "job" | "company" | "enterprise" | "user"
      const normalizedTargetType = targetType === 'enterprise' ? 'company' : targetType;

      if (files.length > 0) {
        const formData = new FormData();
        formData.append('targetType', normalizedTargetType);
        formData.append('targetId', targetId);
        formData.append('reason', selectedReason);
        formData.append('statement', trimmedStatement);
        formData.append('idempotencyKey', idempotencyKey);
        files.forEach((file) => {
          formData.append('files', file);
        });

        const res = await postApiV1MeReports({
          body: formData as unknown as CreateReportRequest,
          bodySerializer: null,
          headers: {
            'Content-Type': null as unknown as string,
          },
        });
        const result = unwrap(res, t('reports.errors.statementRequired'));
        const returnedRef =
          result.reference ||
          (result as unknown as { data?: { reference?: string; ticket_id?: string } })?.data?.reference ||
          (result as unknown as { data?: { reference?: string; ticket_id?: string } })?.data?.ticket_id;
        if (returnedRef) setSubmittedReference(returnedRef);
      } else {
        const res = await postApiV1MeReports({
          body: {
            targetType: normalizedTargetType,
            targetId,
            reason: selectedReason,
            statement: trimmedStatement,
            idempotencyKey,
          },
        });
        const result = unwrap(res, t('reports.errors.statementRequired'));
        const returnedRef =
          result.reference ||
          (result as unknown as { data?: { reference?: string; ticket_id?: string } })?.data?.reference ||
          (result as unknown as { data?: { reference?: string; ticket_id?: string } })?.data?.ticket_id;
        if (returnedRef) setSubmittedReference(returnedRef);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('reports.errors.statementRequired');
      setValidationError(msg);
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('reports.cancel')}
            </Button>
            <Button
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
          <div className="flex items-center gap-2.5 pt-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {targetType === 'job'
                ? t('reports.backToJob')
                : t('reports.backToCompany')}
            </Button>
            <Button
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
            <span className="text-xs text-muted-foreground">
              {targetSubtitle || defaultSubtitle}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                        setValidationError(null);
                      }}
                      className="sr-only"
                    />
                    <span
                      className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-primary bg-white ring-4 ring-primary'
                          : 'border-(--slate-disabled) bg-white'
                      }`}
                    >
                      {isSelected && <span className="size-1.5 rounded-full bg-primary" />}
                    </span>
                    <span className="truncate">{t(`reports.reasons.${reason}`)}</span>
                  </label>
                );
              })}
            </div>
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
              onChange={(e) => {
                setStatement(e.target.value);
                setValidationError(null);
              }}
              placeholder={t('reports.statementPlaceholder')}
              className="w-full rounded-lg border border-(--input) bg-background px-3 py-2 text-sm text-(--ink) placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* File attachments */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length >= REPORT_LIMITS.MAX_FILES}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--fg-link) hover:underline disabled:opacity-50"
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
              accept="image/png,image/jpeg,application/pdf"
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
          </div>

          {/* Privacy line */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Shield className="size-3.5 text-primary shrink-0" aria-hidden="true" />
            <span>{t('reports.privacyLine')}</span>
          </div>

          {/* Validation error notice */}
          {validationError && (
            <div className="p-2.5 rounded-lg bg-(--status-error-bg) border border-(--status-error-fg)/20 text-xs text-(--status-error-fg)">
              {validationError}
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
