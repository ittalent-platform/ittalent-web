import { useState } from 'react';
import { Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ActionConfirmDialog } from '@/components/common/action-confirm-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWithdrawReportMutation } from '@/features/reports/reports.queries';
import type { ReportTargetRef } from '@/features/reports/reports.types';

export interface WithdrawReportDialogProps {
  report: ReportTargetRef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WithdrawReportDialog({ report, open, onOpenChange, onSuccess }: WithdrawReportDialogProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const withdrawMutation = useWithdrawReportMutation();

  if (!report) return null;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await withdrawMutation.mutateAsync({
        id: report.id,
        note: note.trim() || undefined,
      });
      setNote('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to withdraw report.';
      setErrorMessage(message);
    }
  };

  return (
    <ActionConfirmDialog
      action={withdrawMutation.isPending ? t('reports.sending') : t('reports.withdrawDialog.confirm')}
      cancelLabel={t('reports.cancel')}
      description={t('reports.withdrawDialog.body')}
      disabled={withdrawMutation.isPending}
      error={errorMessage}
      icon={Undo2}
      keepOpenOnConfirm
      onConfirm={() => void handleConfirm()}
      onOpenChange={onOpenChange}
      open={open}
      title={t('reports.withdrawDialog.title')}
      variant="warning-solid"
    >
      <div className="flex flex-col gap-2 pt-2">
        <Label htmlFor="withdraw-note-input" className="text-[13px] font-semibold text-foreground">
          {t('reports.withdrawDialog.reasonOptional')}
        </Label>
        <Textarea
          id="withdraw-note-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('reports.withdrawDialog.reasonPlaceholder')}
          rows={3}
          maxLength={500}
          className="text-[13.5px]"
        />
      </div>
    </ActionConfirmDialog>
  );
}
